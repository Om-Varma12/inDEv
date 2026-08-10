import Express = require("express");

const app = Express();

app.use(Express.json());

app.get("/", (req, res) => {
    res.json({
        message: "backend is running!!!"
    })
})

const PORT = 8000
app.listen(PORT, () => {
    console.log(`server is running at ${PORT}`)
})