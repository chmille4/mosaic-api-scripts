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

	await updateClinvar(client, 'clinvar_significance_grch38', 'Pathogenic/Likely_pathogenic');
	// await updateClinvar(client, 'clinvar_significance_grch38', 'Benign/Likely_benign');
  // await updateClinvar(client, 'clinvar_significance_grch37', 'Pathogenic/Likely_pathogenic');
  // await updateClinvar(client, 'clinvar_significance_grch37', 'Benign/Likely_benign');

	await client.end()
})();

async function updateClinvar(client, uid, value) {
  const clinvarAnnotation = await client.query(`select * from annotations where uid = '${uid}'`)

  const clinvarId = clinvarAnnotation.rows[0]?.id;

  if (!clinvarId) {
    return;
  }

  const wrongResult = await client.query(`
      select sv.id as sv_id, * from annotations.a${clinvarId}_string_values sv
      join annotations.a${clinvarId}_possible_values pv ON sv.value_id = pv.id
      where pv.value='${value}'
  `);

  const wrongRows = wrongResult.rows;

  if (wrongRows.length === 0) {
  	return
  }

  const [value1, value2] = value.split('/');

  const valueResult1 = await client.query(`
      select id from annotations.a${clinvarId}_possible_values
      where value = '${value1}'
  `);
  const valueId1 = valueResult1.rows[0]?.id;

  const valueResult2 = await client.query(`
      select id from annotations.a${clinvarId}_possible_values
      where value = '${value2}'
  `);
  const valueId2 = valueResult2.rows[0]?.id;

  if (wrongRows.length === 0) {
    return;
  }
  console.log('num wrongrows = ', wrongRows.length)

  const keys = Object.keys(wrongRows[0]).filter((k) => k !== 'id' && k !== 'value' && k !== 'sv_id');

  const newValues1 = [];
  const newValues2 = [];
  wrongRows.forEach((row) => {
    newValues1.push(` (${keys.map((k) => (k === 'value_id' ? valueId1 : row[k])).map((v) => (v === null ? 'null' : v)).join(',')})`);
    newValues2.push(` (${keys.map((k) => (k === 'value_id' ? valueId2 : row[k])).map((v) => (v === null ? 'null' : v)).join(',')})`);
  });



  // Add value 1
  const batchSize = 500;
  console.log('inserting value 1')
  if (valueId1) {
    for (let i = 0; i < (newValues1.length / batchSize); i += 1) {
      const batch = newValues1.slice(i * batchSize, (i + 1) * batchSize);
      await client.query(`
        insert into annotations.a${clinvarId}_string_values (${keys.join(',')}) values
        ${batch.join(',')}
      `);
    }
  }

  // Add value 2
  console.log('inserting value 2')
  if (valueId2) {
    for (let i = 0; i < (newValues2.length / batchSize); i += 1) {
      const batch = newValues2.slice(i * batchSize, (i + 1) * batchSize);
      await client.query(`
        insert into annotations.a${clinvarId}_string_values (${keys.join(',')}) values
        ${batch.join(',')}   
      `);
    }
  }

  // Remove wrongValues
  console.log('removing old rows')
  for (let i = 0; i < (wrongRows.length / batchSize); i += 1) {
    const batch = wrongRows.slice(i * batchSize, (i + 1) * batchSize);
    await client.query(`
      delete from annotations.a${clinvarId}_string_values where id in (${batch.map((r) => r.sv_id).join(',')})
    `);
  }

  // Remove value from possible values
  await client.query(`
      delete from annotations.a${clinvarId}_possible_values where value = '${value}'
    `);
}


