

// uncomment line below when working in dev enviornment
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const axios = require('axios');
const fs = require('fs')

const {token_id, token_secret} = require(__dirname +'/../mosaic_credentials.json');

if (process.argv.length < 4){
	console.log("Usage:")
	console.log("\tnode mosaicFindBrokenFiles <URL-to-Mosaic> <project_id>");
	console.log("\te.g. node mosaicFindBrokenFiles https://mosaic.frameshift.io 5");
	console.log("Output Format:");
	console.log("\tSample ID\tSample Name\tFile ID\tFile Name\tFile URI")
	process.exit(0);
}
const mosaicUrl = process.argv[2];
const projectId = process.argv[3];

// Set headers for all future requests
axios.defaults.headers.common['Authorization'] = 'Bearer ' + token_secret;
axios.defaults.headers.common['Content-Type'] = 'application/json';



(async () => {
	// Get all project-level files
	var response = await axios.get(mosaicUrl + "/api/v1/projects/"+projectId+"/files");
    var projectFiles = response.data.data;    


	// Get all samples for the project
    var response = await axios.get(mosaicUrl + "/api/v1/projects/"+projectId+"/samples");
    var samples = response.data;

    // Get all sample-level files
    await Promise.all(samples.map(async sample => {
	    var response = await axios.get(mosaicUrl + "/api/v1/projects/"+projectId+"/samples/"+sample.id+"/files");    	
	    sample.files = response.data.data;    	
	    
	    // Check if sample files exist
 		await Promise.all(sample.files.map(async file => {
			var exists = await isAccessible(file.uri);
			file.exists = exists
 		}))
	}))	  
 	
 	outputData(samples);
})();


async function isAccessible(path) {
    const result = await fs.promises.access(path)
        .then(() => true)
        .catch(() => false);

    return result;
}

function outputData(samples) {
	samples.forEach(sample => {
		sample.files.forEach(file => {
			if(!file.exists) {
				console.log(sample.id +"\t"+sample.name+"\t"+file.id+"\t"+file.name+"\t"+file.uri)
			}
		} )
	})
}
