# Sanova

Training application for Finnish individuals with Aphasia as a part of Tampere University's
COMP.SE.610/620 project course.

## Project Structure

The application is implemented as a minimal static website using vanilla JavaScript with JSDoc
annotations for type checking to avoid the build step with more typical TypeScript tooling, which
doesn't seem appropriate for such a small project, but this could change along the way.

## Development Environment

The repository has a containerized development environment that is supported at least by VS Code,
see the official documentation for a [tutorial about the prerequisites][tutorial]. The simple
version is that you need the Dev Containers extension and Docker or a compatible tool (like Podman)
available on your host system.

## Site Deployment

GitHub actions is configured to publish the main branch to [here using GitHub Pages][public].

## License Terms

The project source code is licensed under the MIT license, however the utilized assets (picture and
audio) originate from Papunet's picture and sound banks, being under the CC BY-NC-SA 3.0 license.

[tutorial]: https://code.visualstudio.com/docs/devcontainers/tutorial/
[public]: https://ottomakitalo.github.io/Sanova/
