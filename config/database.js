if (process.env.NODE_ENV === 'production') {
    module.exports={mongoURI: "mongodb://bobbylinux:firenze83@ds245512.mlab.com:45512/note-prod"}
} else {
    module.exports={mongoURI: "mongodb://127.0.0.1:27017/note"}
}