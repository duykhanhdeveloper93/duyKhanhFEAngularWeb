# Daxa

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.0.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.


Bước cài môi trường
+ Cài node js bản mới nhất

Bước 1 kiếm 1 theme angular trên mạng
Bước 2 copy thư mục tất cả file và folder vaò folder có sẵn
Bước 3 
+ Trỏ vào thư mục project chạy lệnh 
  Set-ExecutionPolicy Unrestricted -Scope CurrentUser

+ npm install 
+ yarn install
Bước 4 : Các setup trong tsconfig.json
+ "strictPropertyInitialization": false,  tại angularCompilerOptions để không cần khởi tạo cho giá trị của biến 
-- Lưu ý các cấu hình code ... bla bla đều trong file tsconfig.json

Bước 5: Tạo thêm một thư mục là environments cùng cấp với thư mục app 
Bước 6: Tạo một file local tên là 'environment.local.ts' để lưu các config ví dụ nội dung file 

export const environment = {
    production: false,
    url: 'http://localhost:4200',
    apiUrl: 'http://localhost:3331',
    s3Url: 'https://fileabc.abc.vn',
    voiceUrl: '',
    s3Bucket: 'abc',
    websocketUrl: 'http://localhost:3333'
};

Bước 7: Trong file package.json thêm nội dung 

"scripts": {
    "ng": "ng",
    "serve": "nx serve --configuration=development",
    "serve:staging": "ng serve --configuration=staging",
    "nxserve:staging": "nx serve --configuration=staging",
    "start": "ng serve",
    "serve:local": "ng serve --configuration=local",
    "build": "ng build",
    "nxbuild:production": "nx build --configuration=production",
    "build:production": "node --max_old_space_size=2048 ./node_modules/@angular/cli/bin/ng build --configuration=production --build-optimizer",
    "build:staging": "node --max_old_space_size=2048 ./node_modules/@angular/cli/bin/ng build --configuration=staging --build-optimizer",
    "build:dev": "ng build --configuration=dev --build-optimizer",
    "build:local": "yarn build --configuration=local --build-optimizer",
    "watch": "ng build --watch --configuration development",
    "setup": "rm -rf node_modules & npm i --force",
    "test": "ng test"
  },

  ví dụ ở đây nhé chính là  "serve:local": "ng serve --configuration=local", để dẫn và trỏ tới config là --configuration=local

  Bước 8: Dẫn config này từ trong file angular.json vào đây với các thêm biên local vào

  "local": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.local.ts"
      }
    ],
    "buildOptimizer": true,
    "optimization": true,
    "vendorChunk": true,
    "extractLicenses": true,
    "sourceMap": true,
    "namedChunks": true
  }

  nó là method con của biến mẹ  "configurations": {  } nhé

  Bước 9: Hòm hòm rồi đó . Giờ ta chạy yarn -----> "serve:local" <------ là run được rồi đó