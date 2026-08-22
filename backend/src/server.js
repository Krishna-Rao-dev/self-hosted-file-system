import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
	process.stdout.write(`Server listening on port ${port}\n`);
});
