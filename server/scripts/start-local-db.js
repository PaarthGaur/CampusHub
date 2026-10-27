/** Start CampusHub's per-user Community Server installation, if needed. */
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import config from '../config/env.js';

async function ping() {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 1500 });
    await mongoose.connection.db.admin().ping();
    return true;
  } catch {
    return false;
  } finally {
    await mongoose.disconnect();
  }
}

try {
  if (await ping()) {
    console.log('[MongoDB] Configured database is ready.');
  } else {
    if (!/^mongodb:\/\/(127\.0\.0\.1|localhost):27017\//.test(config.mongoUri)) {
      throw new Error('The configured database is unavailable. Check its service or Atlas configuration.');
    }
    if (!process.env.LOCALAPPDATA) throw new Error('Start your MongoDB service manually on this platform.');
    const installRoot = path.join(process.env.LOCALAPPDATA, 'CampusHub', 'MongoDB');
    const installation = JSON.parse(await readFile(path.join(installRoot, 'installation.json'), 'utf8'));
    const executable = path.resolve(installation.executable);
    if (!executable.startsWith(path.resolve(installRoot) + path.sep) || path.basename(executable) !== 'mongod.exe') {
      throw new Error('The local MongoDB installation path is invalid.');
    }
    const child = spawn(executable, [
      '--dbpath', installation.dataPath,
      '--bind_ip', '127.0.0.1', '--port', '27017',
      '--logpath', installation.logPath, '--logappend'
    ], { detached: true, windowsHide: true, stdio: 'ignore' });
    let launchError;
    child.once('error', error => { launchError = error; });
    child.unref();
    let ready = false;
    for (let attempt = 0; attempt < 12; attempt++) {
      if (launchError) throw new Error('Unable to launch the local MongoDB executable.');
      await delay(250);
      if (await ping()) { ready = true; break; }
    }
    if (!ready) throw new Error('MongoDB did not become ready. Inspect its log under Local AppData/CampusHub/MongoDB.');
    console.log('[MongoDB] Community Server started on 127.0.0.1:27017.');
  }
} catch (error) {
  console.error('[MongoDB] ' + (error.code === 'ENOENT' ? 'No per-user installation found. Install MongoDB or start its service.' : error.message));
  if (!process.argv.includes('--optional')) process.exitCode = 1;
}
