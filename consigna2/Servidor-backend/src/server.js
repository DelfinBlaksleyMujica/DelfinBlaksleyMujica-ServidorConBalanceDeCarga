//Dotenv

const dotenv = require("dotenv");
dotenv.config();
const staticDir = process.env.STATIC_DIR;
const sessionSecret = process.env.SECRET_SESSION;

//Conexion de Servidor

const express = require("express");
const app = express();
const { options } = require("./config/options");
const PORT = options.server.PORT;
const handlebars = require("express-handlebars");

//Cluster

const cluster = require("cluster");
const os = require("os");
const numCores = os.cpus().length;

//Conexion con routers

const { viewsRouter } = require("./routes/viewsRouter");
const { AuthRouter } = require("./routes/auth.routes");
const { RandomsRouter } = require("./routes/randoms.routes");

//Conexion de Sessions

const session = require("express-session");
const cookieParser = require("cookie-parser");

//Conexion con Middleware de Autenticacion Passport

const passport = require("passport");

//Conexion con Base de datos 

const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");

//Conexion con mongoose

mongoose.connect( options.mongoDB.url , {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then( () => {
    console.log("Base de datos conectada exitosamente!!");
});

//Configuracion de la session

app.use(cookieParser());

//Modo Cluster o Fork

if ( options.server.MODO === "CLUSTER" && cluster.isPrimary ) {
    
    for (let i = 0; i < numCores; i++) {
        cluster.fork();
    }

    cluster.on( "exit", ( worker ) => {
        console.log(`Proceso ${ worker.process.pid } murio`);
        cluster.fork();
    });
}else{
    //Conexion del servidor
    const server = app.listen( PORT , () => {
        console.log( `Server listening on port ${ server.address().port } on process ${ process.pid }` );
    });
    server.on( "error" , error => console.log(`Error en el servidor: ${error}` ) );
    
    //Servicio estaticos
    app.use( express.static( __dirname+`/${staticDir}` ) );

    //Motor de plantilla
    app.engine("handlebars" , handlebars.engine() );
    app.set( "views" , __dirname+"/views" );
    app.set("view engine" , "handlebars" );

    //Interpretacion de formatos
    app.use( express.json() );
    app.use( express.urlencoded( { extended: true } ) );
    app.use(session({
        store: MongoStore.create({
            mongoUrl: options.mongoDB.url,
            ttl:600
        }),
        secret: sessionSecret,
        resave: true,
        saveUninitialized: true
    }));
    //Configuracion de Passport
    app.use( passport.initialize() );
    app.use( passport.session() );
    
    //Routes
    app.use( viewsRouter );
    app.use( AuthRouter );
    app.use( "/api/randoms" , RandomsRouter );

}



