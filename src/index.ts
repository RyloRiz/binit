#!/usr/bin/env node

import { exec } from 'child_process';
import CLIMake from 'climake';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as semver from 'semver';

let pathToBin = path.join(os.homedir(), 'binit/bin');

let cli = new CLIMake();

cli.help(true);
cli.version("0.1.0");

let addCmd = cli.command('add', 'Add a .tgz package to the package bin', (opts: { _: {} }) => {
	if (opts._[0]) {
		let r = /[A-Za-z0-9_\-\.]+\.[A-Za-z0-9]+$/.exec(opts._[0])[0];
		let exists = fs.existsSync(path.join(pathToBin, r));

		if (exists && !opts['force']) {
			console.log('Package already exists in bin - add the \'--force\' arguments to overwrite!');
			return;
		}

		try {
			fs.cpSync(path.join(process.cwd(), opts._[0]), path.join(pathToBin, r));
			if (opts['move']) {
				fs.rmSync(path.join(process.cwd(), opts._[0]));
			}
		} catch (err) {
			console.log("[INTERNAL] Failed to transfer package");
		}
	} else {
		console.log("Please specify a .tgz package!");
	}
});

addCmd.argument('force', 'f', 'Overwrite package in binit bin if it exists');
addCmd.argument('move', 'm', 'Move .tgz package instead of copying');

let installCmd = cli.command('install', 'Install a local .tgz package into the working directory/project', (opts) => {
	// Validate necessary arguments
	if (!opts._[0]) {
		console.log("You must provide a package name to install!");
		return;
	}
	
	// Find binit folder OR make it
	let binitPath = path.join(process.cwd(), 'binit');
	let binitExists = fs.existsSync(binitPath);

	if (!binitExists) {
		fs.mkdirSync(binitPath);
	}

	// Get .tgz from bin folder IF exists
	let pkgs = fs.readdirSync(pathToBin);
	let name: string, version: string;
	let tgzPath: string, fPkgName: string;

	if (opts._[0].includes('@')) {
		let split = opts._[0].split('@');
		name = split[0];
		version = split[1];
	} else {
		name = opts._[0];
		version = 'latest';
	}

	if (version === 'latest') {
		let potential = [];
		for (let index = 0; index < pkgs.length; index++) {
			const potentialPkg = pkgs[index];
			if (potentialPkg.split('-')[0] === name) {
				potential.push(potentialPkg.split('-')[1].split('.tgz')[0]);
			}
		}
		potential.sort(semver.rcompare);
		fPkgName = `${name}-${potential[potential.length - 1]}.tgz`
		tgzPath = path.join(pathToBin, fPkgName);
	} else {
		let pkgName = `${name}-${version}.tgz`;
		if (pkgs.find(p => p === pkgName)) {
			fPkgName = pkgName;
			tgzPath = path.join(pathToBin, fPkgName);
		} else {
			console.log("You must provide a VALID package to install!");
		}
	}

	// COPY to binit folder
	let newPath = path.join(binitPath, fPkgName)
	fs.cpSync(tgzPath, newPath);

	// Install the .tgz into node_modules
	exec(`npm install "${newPath}"`, (error, stdout) => {
		if (error) {
			if (opts['verbose']) {
				console.error(error);
			} else {
				console.log(`An error occurred when installing '${name}' into node_modules. Use the -v flag for more information.`);
			}
		}
	});
});

installCmd.argument('verbose', 'v', 'Log more detailed information if error occurs');

cli.parse(process.argv);