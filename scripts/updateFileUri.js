

// uncomment line below when working in dev enviornment
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const axios = require('axios');
const fs = require('fs')

const {token_id, token_secret} = require(__dirname +'/../mosaic_credentials.json');

if (process.argv.length < 7){
	console.log("Description:")
	console.log("\tThis script will update a file uri with a new given uri")
	console.log("Usage:")
	console.log("\tnode mosaicUpdateFilePaths <URL-to-Mosaic> <project_id> <sample_id> <file_id> <new_uri> ");	
	console.log("\t e.g. node mosaicUpdateFilePaths https://mosaic.frameshift.io 5 2 10 /data/1.bam")
	process.exit(0);
}
const mosaicUrl = process.argv[2];
const projectId = process.argv[3];
const sampleId = process.argv[4];
const fileId = process.argv[5];
const uri = process.argv[6];

// Set headers for all future requests
axios.defaults.headers.common['Authorization'] = 'Bearer ' + token_secret;
axios.defaults.headers.common['Content-Type'] = 'application/json';



(async () => {
	// Update File URI		
    var response = await axios.put(
    	mosaicUrl + "/api/v1/projects/"+projectId+"/samples/"+sampleId+"/files/"+fileId,
    	{ 'uri': uri }
    );

    console.log("URI for sample " + response.data.name + " updated to: " + response.data.uri);    
})();
