# mosaic-api-scripts
Miscellaneous api scripts for the Mosaic genomics platform


## Install
```
git clone https://github.com/chmille4/mosaic-api-scripts.git
cd mosaic-api-scripts
npm install
```

## Add credentials
1. Generate API Access Token on the Mosaic web app at mosaic_instance_url/#/account/settings
2. Change name of file `mosaic_credentials.json.template` to `mosaic_credentials.json`
3. Add credentials to `mosaic_credentials.json`

## Usage
All scripts are in `/scripts` and each script is a standalone script. For example:
```
node findBrokenFiles.js https://mosaic.frameshift.io 2
```
