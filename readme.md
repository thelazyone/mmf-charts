Live Demo (updated April 26th 2023): https://test.thelazyforger.com/mff-chart/

# Installation
For the moment the tool works through npm and webpack.

Install webpack: <code>npm install --save-dev webpack webpack-cli ts-loader</code>
Same for echarts: <code>npm install --save echarts</code>
And for papaparse: <code>npm install --save papaparse</code>

To avoid local paths to mess stuff up, I've added webpack as part of the local scripts of the package.json. this way, you can package the project every time you call <code>npm run build</code>.

I'd recommend the "Live Server" plugin for VSCode to open your solution locally with one click, but I'm sure there's plenty of other options too.

