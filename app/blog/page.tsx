// `/blog` alias of the home index. The live site's index is reachable at both `/`
// and `/blog` (edge router `index` class matches `^/(blog/?)?$`); this route keeps
// `/blog` resolving 200 in the new app rather than 404-ing (REBUILD §3A: every
// indexed URL type resolves). Re-exports the home index unchanged.
export { default, generateMetadata } from "../page";
