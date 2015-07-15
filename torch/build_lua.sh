cd /tmp
git clone https://github.com/torch/luajit-rocks.git
cd luajit-rocks
mkdir build
cd build
cmake .. -DCMAKE_INSTALL_PREFIX=/usr -DCMAKE_BUILD_TYPE=Release -DWITH_LUAJIT21=ON
make -j4
make install

luarocks install sundown       
luarocks install cwrap 
luarocks install paths 
luarocks install torch 
luarocks install nn    
luarocks install dok   
luarocks install gnuplot 
luarocks install qtlua 
luarocks install qttorch 
luarocks install luafilesystem
luarocks install penlight
luarocks install sys        
luarocks install xlua       
luarocks install image      
luarocks install optim      
luarocks install lua-cjson  
luarocks install trepl      
luarocks install nnx
luarocks install threads
luarocks install graphicsmagick
luarocks install argcheck
luarocks install audio
luarocks install signal
luarocks install gfx.js
