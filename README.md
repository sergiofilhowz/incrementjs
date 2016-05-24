# Increment JS
Global Module to increment NodeJS Modules

## Install
`npm install incrementjs -g`

## Usage
increment folder_name [version/major/minor/patch]

examples:

    increment myproject 1.2.3
    increment myproject major
    increment myproject minor
    increment myproject patch
    
    increment myproject 
    same as 
    increment myproject patch

This project will also increment any modules on the same folder hierarchy that has dependency to the incremented module

### Example

modulea has a dependency for moduleb : "^1.0.1"
moduleb is on "1.0.1"
they are all on /workspace

    cd /workspace
    increment moduleb minor
   
then moduleb will be on version 1.1.0 and moduleab will have its dependency also incremented to 1.1.0