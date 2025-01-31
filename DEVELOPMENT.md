<div align="center">

![Uncharted Facets](assets/logo_320.png)

</div>

# Development
---  
The Facets library is split in three packages:
1. `facets-core` contains all the components necessary to start using facets in your project
2. `facets-plugins` is a collection of components that extend facets' behavior, look and feel
3. `facets-docs` documentation and examples live here

The only packages published to the registry are `facets-core` and `facets-plugins` 


## Building

Check out or download this repo, then, from the repo's root folder run the following commands:

If not already enabled, enable corepack, then allow it to install yarn:
```shell script
corepack enable
corepack install
```

```shell script
yarn install
yarn build
```

Or build the packages individually from their respective directories:

Build `facets-core`.
```shell script
$ cd packages/facets-core
yarn build
```

Build `facets-plugins`. (Optional)
```shell script
cd packages/facets-plugins
yarn build
```

Run the `facets-docs` package and use it as a testbed:
```shell script
cd packages/facets-docs
yarn build
yarn start
```

On your browser navigate to http://localhost:5173/  

Changes to the docs code will appear automatically but if you make changes to `facets-core` or `facets-plugins` you will need to rerun `yarn build` for
whichever you've changed, and then `yarn build` and `yarn start` for `facets-docs`. (Note: In theory you could do `yarn start` in `facets-core` and `facets-plugins`
and have everything update automatically but I've not had success with that.)


## Publish

From the root of the repo:

- Bump the package versions. 'patch' is an example. use the yarn [options](https://yarnpkg.com/cli/version), such as `patch | minor | major | prerelease`
```shell script
yarn bump patch
```

- Log into the uncharted npm registry for publishing (see `.yarnrc.yml` > `npmPublishRegistry`)
```shell script
yarn npm login --publish
```

- Individually publish facets-core and facets-plugins
 ```shell script
yarn workspace @uncharted.software/facets-core npm publish --access=public
yarn workspace @uncharted.software/facets-plugins npm publish --access=public
```
