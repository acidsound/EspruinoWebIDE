#!/bin/bash
cd `dirname $0`
cd ..
rm -f NodeMCUSerialTerminal.zip

mkdir img/bak
cp img/icon_*.png img/bak
cp extras/web_store/icon_*.png img
zip -9 -r --exclude=@extras/chrome_exclude.lst NodeMCUSerialTerminal.zip .
cp img/bak/icon_*.png img
rm -rf img/bak
