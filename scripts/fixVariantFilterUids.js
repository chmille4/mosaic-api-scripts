const pg = require('pg')
const fs = require('fs');

const config = require(__dirname +'/../db_credentials.json');

if (process.argv.length < 2){
	console.log("Usage:")
	console.log("\tnode fixVariantFilterUids.js");	
	process.exit(0);
}


(async () => {

	const { Client } = pg;
	const client = new Client(config);
	await client.connect()

	const results = await client.query(`SELECT * from variant_filters`);



	for (let index in results.rows) {
		const variantFilter = results.rows[index];
		const annotation_filters = variantFilter.filter.annotation_filters;
		if (annotation_filters) {
			for (let afIndex in annotation_filters) {
				const af = annotation_filters[afIndex]
				const r = await client.query(`
					SELECT a.uid from annotations a 
					join annotation_versions av on a.id = av.annotation_id
					where av.id = ${af.annotation_version_id}
				`)
				const newUid = r.rows[0].uid;
				variantFilter.filter.annotation_filters[afIndex].uid = newUid
			}
			const sql = `UPDATE variant_filters set filter = '${JSON.stringify(variantFilter.filter)}' where id = ${variantFilter.id}`;
			await client.query(sql);
		}
	}
	await client.end()
})();