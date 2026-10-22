# site

The Locus graph library, served from Cloud Run. `build.js` writes it from the files in the Package Registry, so the
site serves exactly what was released:

- **Home:** the newest plates floating in 3D (three.js, coloured by height), a carousel that wraps around.
- **Graph pages** (`/graphs/<artifactId>/`): the plate in 3D, the drawing with each touch rule highlighted on hover,
  the braille ID, downloads (STL, SVG, overlay, description, manifest, zip), how the graph was made, and Print again.
- **About, Request, Collections, Credits.** Request drafts the email for a teacher, from typed or spoken words.
- **`/build-info.json`:** the commit, pipeline and graphs of this build (docs/contracts.md §9).

`validate.js` (`locus validate-site <url>`) reads the deployed site like a visitor: the build commit, every page
served as a page, and every file's hash against its manifest. `validate-staging` and `post-deploy-smoke` run it.
