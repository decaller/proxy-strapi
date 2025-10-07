This is easy docekr image creation for strapi with external postgres

do `npx create-strapi@latest`

run it dev local first `npm run dev` and make changes

do changes :

config/server.ts
```
export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('URL', ''),
  proxy: { koa: env.bool('IS_PROXIED', true) }, // THIS IS VERY IMPORTANT
  app: {
    keys: env.array('APP_KEYS'),
  },
});
```
sources : https://docs.strapi.io/cms/configurations/server#server-configuration , https://docs.strapi.io/cms/configurations/admin-panel#deploy-on-different-servers

.env
```
HOST=0.0.0.0
PORT=1337
URL=https://   # Your url goes here, only support domain or domain/path

JWT_SECRET=   # run crypto.randomBytes(16).toString('base64') or $bytes = New-Object byte[] 16; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [System.Convert]::ToBase64String($bytes)   i forgot when this is automatically generated

# the rest of parameter are auto generated
```

Dockerfile
```
# This Dockerfile is optimized by AI, use the default in the source if you got any error

# Creating multi-stage build for production
FROM node:22-alpine AS build
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git > /dev/null 2>&1
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY package.json package-lock.json ./
RUN npm install -g node-gyp
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm install --only=production
ENV PATH=/opt/node_modules/.bin:$PATH
WORKDIR /opt/app
COPY . .
RUN npm run build

# Creating final production image
FROM node:22-alpine
RUN apk add --no-cache vips-dev
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules
WORKDIR /opt/app
COPY --from=build /opt/app ./
ENV PATH=/opt/node_modules/.bin:$PATH

RUN chown -R node:node /opt/app
USER node
EXPOSE 1337
CMD ["npm", "run", "start"]

```
source : https://docs.strapi.io/cms/installation/docker#production-dockerfile

.dockerignore
```
.git
.dockerignore
node_modules
npm-debug.log
Dockerfile
.env
```


Other settings outside :

Caddyfile
```
yoursub.yoururl.com { # your url goes here, simple reverse proxy maybe would be ok
    # Enable compression (gzip, brotli, zstd) for faster loading times
    encode zstd gzip

    # Reverse proxy requests to the Strapi backend
    reverse_proxy localhost:1337 { # Or your docker container name/port
        # Forward essential headers to the backend application
        header_up Host {host}
        header_up X-Real-IP {remote_ip}
        header_up X-Forwarded-For {remote_ip}
        header_up X-Forwarded-Proto {scheme}
    }

}
```
or if you use subpath
```
yoursub.yoururl.com {
    # This block handles requests specifically for your subpath
    handle_path /your-path/* {
        reverse_proxy localhost:1337 # Or your docker container name/port
    }

    # You can add other handlers here if needed
}
```
other source : https://forum.strapi.io/t/caddy-proxying-with-strapi/40616 , note the settings in the link kinda dont work for me, so i don't use it

Docker compose for postgresql
```
services:
  db:
    image: postgres:latest
    restart: always
    environment:
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}
    ports:
      - '${DATABASE_PORT}:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Docker build args (maybe not needed)
```
NODE_ENV=production 
STRAPI_URL=https://yoursub.yoururl.com \ # Change to your URL
```



FAQ

Why don't you use prepared image?
> The official image is no longer updated

Why don't you make it into an image?
> This way it will be easier for everyone to use the latest version of strapi

Why don't you use sqlite?
> in producation sqlite database is placed at .tmp, so it will be deleted as deployed

Any recommendation?
> I use komo.do to this git, then i can build it once to serve multiple project with auto update every manual build

Is this for small project only?
> Yes it is... if you need kubernetes, i don't think you would need this guide


