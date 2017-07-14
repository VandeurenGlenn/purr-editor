PRE_DEST='build/bundled/bower_components'

mkdir -p $PRE_DEST/ace-builds
cp -u -f -R bower_components/ace-builds/src-min-noconflict $PRE_DEST/ace-builds

mkdir -p $PRE_DEST/jszip/dist
cp -u -f -R bower_components/jszip/dist/*min.js $PRE_DEST/jszip/dist/jszip.min.js

mkdir -p $PRE_DEST/file-saver
cp -u -f -R bower_components/file-saver/*min.js $PRE_DEST/file-saver/FileSaver.min.js

cp -u -f -R manifest.json build/bundled/manifest.json
