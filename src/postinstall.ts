import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

let pathToBin = path.join(os.homedir(), 'binit/bin');

let exists = fs.existsSync(pathToBin);

if (!exists) {
	fs.mkdirSync(pathToBin, { recursive: true });
}