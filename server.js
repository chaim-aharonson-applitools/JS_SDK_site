const express = require('express'); 
const app = express();
const port = process.env.PORT || 5005; 
const fs = require("fs");
const path = require("path");
const readdirp = require("readdirp");
const _ = require("lodash");
const { execSync, exec } = require("child_process");
// https://www.section.io/engineering-education/how-to-setup-nodejs-express-for-react/
// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`)); 

const options = {
  stdio: "inherit",
};
const runAsync = (script, key, args) => {
  args = args ? `-- ${args.join(" ")}` : "";
  return new Promise((resolve, reject) => {
    try {
      exec(`${script} ${args}`, options, (error, output) => {
        if (error) {
          //throw error;
          return resolve({output: 'N/A', key});
        }

        return resolve({output, key});
      });
    } catch (e) {
      return resolve({output: 'N/A', key});
      //return reject(null);
    }
  });
};
let maxSize, doneCounter, allDeps, latestList;
//https://github.com/flaviotulino/npm-commands/blob/master/index.js
const controller = ({ output, key }, resolveData) => {
  output = output.replace(/[^\d.]/g, '');
  allDeps[key].latest = output || 'N/A';
  doneCounter++;
  if ((doneCounter === counter)) {
    //console.log(JSON.stringify(allDeps));
    resolveData(allDeps)
  }
};

const basePath = '/Users/chaimaharonson/dev/eyes.sdk.javascript1/packages/'

const parseProps = {dependencies: {}, devDependencies: {}};
const ignoreProps = ['@types', '@applitools'];
const runOnTree = () => new Promise((resolve, reject)=>{
  maxSize = 250;
  counter = 0;
  doneCounter = 0;
  allDeps = {};
  latestList = new Set();
  parseProps.dependencies = {};
  parseProps.devDependencies = {};
  readdirp.promise(basePath, {fileFilter: 'package.json', depth: 2, alwaysStat: true}).then( resp => {
    resp.map((file) => {
      const package = file.path.split('/')[0];
      const packageJsonPath = path.resolve(basePath, file.path);
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
      _.each(parseProps, (val, prop) => {
          const deps = packageJson[prop];
          _.each(deps, (ver, key) => {
            if(!_.includes(ignoreProps, key.split('/')[0])){
              // const entity = parseProps[prop][key] || { versions: {}, packages: {} }; 
              // entity.versions[ver] = entity.versions[ver] || 0;
              // entity.versions[ver] += 1;
              // entity.packages[package] = ver;
              // parseProps[prop][key] = entity;
              const _entity = allDeps[key] || { versions: {}, packages: {}, latest: '', total: 0, dependencies: [] };
              _entity.versions[ver] = _entity.versions[ver] || 0;
              _entity.versions[ver] += 1;
              _entity.total += 1;
              _entity.packages[package] = ver;
              _entity.dependencies.push(prop);
              _entity.dependencies = _.uniq(_entity.dependencies);
              allDeps[key] = _entity;
              if (!latestList.has(key) ) {//&& maxSize > 0
                maxSize--;
                counter++;
                latestList.add(key);
                runAsync(`npm view ${key} version`, key).then((resp) => {
                  controller(resp, resolveData);
                });
              }
            }
          });
      });
    });
    //console.log("done", counter);
  });
  const resolveData = () => {
    resolve(allDeps)
  }
})

// create a GET route
app.get('/express_backend', (req, res) => { 
  try {
    runOnTree().then( result => {
      res.status(200).json(result);
    })
  } catch(error) {
    res.status(500).end(error);
  }
}); 