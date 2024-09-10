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
		if (index % 200 === 0) {
			console.log(index)
		}
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
			try {
				const sql = {
					text: `UPDATE variant_filters set filter = $1 where id = ${variantFilter.id}`,
					values: [variantFilter.filter]
				}
				await client.query(sql);
			} catch(error) {
				console.log(error)
				console.log('variant filter id = ', variantFilter.id)
				console.log('filter = ', JSON.stringify(variantFilter.filter));
			}
		}
	}
	await client.end()
})();