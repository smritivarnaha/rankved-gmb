async function main() {
  const res = await fetch("https://mybusiness.googleapis.com/$discovery/rest?version=v4");
  const data = await res.json() as any;
  console.log("Top level resources:", Object.keys(data.resources));
}
main();
