const dotenv = require("dotenv").config();
//Yargs

const argumentos = process.argv.slice(2);
const Yargs = require("yargs/yargs")(argumentos);

const args = Yargs
    .default({
        m:"FORK",
        p: 8081,        
    })
    .alias({
        m:"modo",
        p:"port"
    })
    .argv;


const options = {
    mongoDB: {
        url:process.env.MONGO_URL
    },
    server: {
        PORT: args.port,
        MODO: args.modo
    }
}

module.exports = { options }