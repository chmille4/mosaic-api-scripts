const pg = require('pg')
const fs = require('fs');

const config = require(__dirname +'/../db_credentials.json');

if (process.argv.length < 5){
	console.log("Usage:")
	console.log("\tnode updateOldAnnotationUids.js <univerisal-csv-file> <uid-column-name> <cat-column-name>");	
	console.log("\t e.g. node mosaicPostGatheredJson annotation-maps.csv uid_udn cat_udn")
	process.exit(0);
}

const universalMapFile = process.argv[2];
const uidColumn = process.argv[3];
const catColumn = process.argv[4];
const dryRun = process.argv[5]?.toLowerCase() == 'true';

if (dryRun) {
	console.log('Dry Run .......')
}
(async () => {

	const { Client } = pg;
	const client = new Client(config);
	await client.connect()

	const universalUidColumn = 'universal_uid';
	const universalCatColumn = 'universal_cat';
	const updated = [];
	const missingNew = [];
	const missingOld = [];

	const data = fs.readFileSync(universalMapFile, 'utf8');

	const annotations = data.split("\n").map(row => row.trim().split(','))
	const headers = annotations.shift();

	const univeralUidIndex = headers.findIndex(d => d === universalUidColumn);
	const univeralCatIndex = headers.findIndex(d => d === universalCatColumn);
	const uidIndex = headers.findIndex(d => d === uidColumn);
	const catIndex = headers.findIndex(d => d === catColumn);

	// for (let i = 0; i < cars.length; i++) {
	// annotations.forEach(row => {
	for (let index in annotations) {
		const row = annotations[index];
		const universalUid = row[univeralUidIndex];
		const universalCat = row[univeralCatIndex];
		const uid = row[uidIndex];
		const cat = row[catIndex];
		
		if (universalUid && uid) {
			// const result = await client.query(`SELECT name from annotations where uid = '${uid}'`)
			const catQuery = universalCat ? `,category = '${universalCat}'` : '';
			if (!dryRun) {
				const result = await client.query(`
					UPDATE annotations 
					set 
						uid = '${universalUid}'
						${catQuery}
					where uid = '${uid}'
				`);
			}
			updated.push({
				new: universalUid,
				old: uid,
				newCat: universalCat,
			})
		} else if (!uid) {
			missingOld.push({
				new: universalUid,
				old: uid,
				newCat: universalCat,
			})
		} else if (!universalUid) {
			missingNew.push({
				new: universalUid,
				old: uid,
				newCat: universalCat,
			})
		}
	}
	const log = {
		updated,
		missingNew,
		missingOld,
	}
	console.log(log);
	await client.end()
})();