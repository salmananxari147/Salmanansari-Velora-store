import mongoose from 'mongoose';

function parseSrvUri(uri) {
  const match = uri.match(/^mongodb\+srv:\/\/([^:/?#]+):([^@]+)@([^/?]+)\/?([^?]*)/);
  if (!match) return null;
  return {
    user: decodeURIComponent(match[1]),
    password: decodeURIComponent(match[2]),
    host: match[3],
    db: match[4] || '',
  };
}

async function dnsOverHttps(name, type) {
  const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`);
  if (!response.ok) throw new Error('Could not resolve the MongoDB host');
  const body = await response.json();
  return body.Answer || [];
}

async function expandSrvUri(uri) {
  const parsed = parseSrvUri(uri);
  if (!parsed) throw new Error('MONGO_URI is not a valid mongodb+srv connection string');

  const [srv, txt] = await Promise.all([
    dnsOverHttps(`_mongodb._tcp.${parsed.host}`, 'SRV'),
    dnsOverHttps(parsed.host, 'TXT'),
  ]);
  const hosts = srv
    .map((record) => String(record.data).trim().split(/\s+/))
    .filter((parts) => parts.length >= 4)
    .map((parts) => `${parts[3].replace(/\.$/, '')}:${parts[2]}`);
  if (!hosts.length) throw new Error('Could not resolve the MongoDB host');

  const options = String(txt[0]?.data || '').replace(/"/g, '');
  const user = encodeURIComponent(parsed.user);
  const password = encodeURIComponent(parsed.password);
  const query = [options, 'tls=true'].filter(Boolean).join('&');
  return `mongodb://${user}:${password}@${hosts.join(',')}/${parsed.db}?${query}`;
}

async function open(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
}

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is missing from the backend environment');

  try {
    await open(uri);
  } catch (err) {
    const dnsFailed = err?.syscall === 'querySrv' || String(err?.message || '').includes('querySrv');
    if (!uri.startsWith('mongodb+srv://') || !dnsFailed) throw err;
    console.warn('System DNS could not resolve MongoDB. Retrying through DNS over HTTPS.');
    await open(await expandSrvUri(uri));
  }

  const { host, name } = mongoose.connection;
  console.log(`Connected to MongoDB (${host}/${name})`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
