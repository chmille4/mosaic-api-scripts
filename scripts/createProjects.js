

// uncomment line below when working in dev enviornment
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const axios = require('axios');
const fs = require('fs')

const {token_id, token_secret} = require(__dirname +'/../mosaic_credentials.json');

if (process.argv.length < 5){
	console.log("Usage:")
	console.log("\tnode createProjects.js <URL-to-Mosaic> <projectNames.txt> <reference>");
	console.log("\te.g. node createProjects.js https://mosaic.frameshift.io projectNames.txt GRCh38");
	console.log("Description");
	console.log("\tThis takes a file with 1 project name per line and creates that project if it doesn't already exsist")
	process.exit(0);
}

const mosaicUrl = process.argv[2];
const projectNamesFile = process.argv[3];
const reference = process.argv[4];

// Set headers for all future requests
axios.defaults.headers.common['Authorization'] = 'Bearer ' + token_secret;
axios.defaults.headers.common['Content-Type'] = 'application/json';



(async () => {
	// Get all of users current projects
	var response = await axios.get(mosaicUrl + "/api/v1/projects");
    const projects = response.data.data;
    const existingProjectNames = projects.map(p => p.name);


    // Get only projects that don't already exist
    const givenProjectNames = fs.readFileSync(projectNamesFile, 'utf8').trim().split('\n');
    const newProjectNames = givenProjectNames.filter(n => existingProjectNames.indexOf(n) == -1);

    // try {
    const projResponse = await Promise.all(newProjectNames.map(async name => {
    	var projectInfo = {name, reference, privacy_level:'private', description: `${name} family trio`};
		return axios.post(mosaicUrl + "/api/v1/projects/", projectInfo);
	}))

	console.log(projResponse.map(r => r.data));
	// }
	// catch(error) {
	// 	console.log(error.response.data.message + " " + error.response.status);
	// }

    console.log(newProjectNames);
    process.exit(0);

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



