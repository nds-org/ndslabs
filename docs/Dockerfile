# Using official sphinx image
FROM sphinxdoc/sphinx as build

# Install Sphinx deps
WORKDIR /usr/src
COPY requirements.txt . 
RUN pip install -r requirements.txt

# Perform Sphinx build
COPY . .
RUN make clean html


# With a new NGINX container for runtime
FROM nginx as runtime

# Copy built documentation to nginx
COPY --from=build /usr/src/_build/html /usr/share/nginx/html

