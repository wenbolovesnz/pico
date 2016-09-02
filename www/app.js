var myApp = angular.module('myApp')

myApp.controller('MainController', function($scope, User, Firebase, spinner){
    console.log('main');
    $scope.spinner = spinner;
    $scope.user = User;        
    $scope.error = '';
            
    $scope.login = function(){
        $scope.spinner.on = true;
        User.loginUser($scope.email, $scope.password, $scope.rememberMe).then(function(userData){                        
            $scope.spinner.on = false;
        }, function(error){
            $scope.spinner.on = false;     
            $scope.error = error.message;
        });          
    };
        
    $scope.logOut = function(){
        User.logOut();
    };
    
    if(!$scope.user.userInfo){
        var localUser = User.getLocalUser();
        if(localUser){
            $scope.email = localUser.email;
            $scope.password = localUser.password;
            $scope.rememberMe = true;
            $scope.login();
        }
    }
});

myApp.controller('KidsController', function($scope, User, Firebase){
    $scope.kids = [];
    
    function addKeys(object){
        for(key in object){
            object[key].key = key;                         
        }
    }
    
    if(User.userInfo && User.userInfo.kids){
        $scope.kids = User.userInfo.kids;
        addKeys($scope.kids);
    }else{
        Firebase.child("users").child(Firebase.getAuth().uid).once('value', function(snapShot){
            var uid = User.userInfo.uid;
            User.userInfo = snapShot.val();
            User.userInfo.uid = uid;
            
            $scope.kids = User.userInfo.kids;
            addKeys($scope.kids);
            $scope.$apply();
        });
    }
    
    $scope.details = function(kid){
        var options = {
          animation: 'slide',
          kid: kid
        };
        myNavigator.pushPage("kid.html", options);
    };
});

myApp.controller('NotesController', function($scope, Firebase, User){
    var page = myNavigator.getCurrentPage();
    $scope.kid = page.options.kid;            
    $scope.isEdit = false;
    $scope.save = function(){
        Firebase.child('users').child(Firebase.getAuth().uid).child('kids').child($scope.kid.key).update($scope.kid);
        $scope.isEdit = false;
    };
});

myApp.controller('ContactsController', function($scope, Firebase, User){
    var page = myNavigator.getCurrentPage();
    $scope.kid = page.options.kid;        
    $scope.family = User.userInfo.families[$scope.kid.family];    
    $scope.isEdit = false;
    
    $scope.saveContacts = function(){        
        Firebase.child('users').child(Firebase.getAuth().uid).child('families').child($scope.kid.family).update(JSON.parse(angular.toJson($scope.family)));
        $scope.isEdit = false;
    };
});

myApp.controller('AllPhotosController', function($scope, Firebase, User){
    var page = myNavigator.getCurrentPage();    
    $scope.images = [];
    $scope.kid = page.options.kid;
    
    var convertImages = function(){
        $scope.images = [];
        var imagesTemp = page.options.kid.images;    
        var tempArray = [];
        for(var key in imagesTemp){
            imagesTemp[key].key = key;
            imagesTemp[key].createdDateTime = new Date(imagesTemp[key].createdDateTime);
            tempArray.push(imagesTemp[key]);
        }
        $scope.images = tempArray;
    }
        
    Firebase.child('users').child(Firebase.getAuth().uid).child('kids').child(page.options.kid.key)
                .child('images').on('value', function(snap){
                    page.options.kid.images = snap.val();
                    convertImages();
                    $scope.$apply();
                });
        
    $scope.setTitle = function(image){        
        ons.notification.prompt({
          message: "Please enter a title",
          callback: function(title) {
            image.title = title;
            $scope.$apply();
            Firebase.child('users').child(Firebase.getAuth().uid).child('kids').child(page.options.kid.key)
                .child('images').child(image.key).update(JSON.parse(angular.toJson(image)));            
          }
        });
    };
    
    $scope.setAvatar = function(image){
        ons.notification.confirm({
          message: 'Set this photo as Avatar?',
          callback: function(idx) {
            switch(idx) {
              case 0:
                break;
              case 1:                
                page.options.kid.avatar = image.url;
                Firebase.child('users').child(Firebase.getAuth().uid).child('kids').child(page.options.kid.key)
                .set(JSON.parse(angular.toJson(page.options.kid)));            
                break;
            }
          }
        });  
    };
});

myApp.controller('EmailController', function($scope, Firebase, User){
    var page = myNavigator.getCurrentPage();
    $scope.kid = page.options.kid;
    $scope.family = User.userInfo.families[$scope.kid.family];
    
    $scope.send = function(){
        var selectedContacts = $scope.family.contacts.map(function(contact){
            if(contact.selected){
                return contact.email;
            }
        });
        
        if(selectedContacts.length == 0 || !$scope.subject || !$scope.body){
            alert('Please enter subject and body with at least 1 recipient.');
        }else{
            var emailObject = {
                emails: selectedContacts,
                token: Firebase.getAuth().token,
                subject: $scope.subject,
                body: $scope.body
            };
            Firebase.child('emails').push(emailObject);
            $scope.subject = null;
            $scope.body = null;
            alert('Email(s) have been sent successfully.');
        }
    };
        
});

myApp.controller('KidController', function($scope, User, Firebase, spinner){
    var page = myNavigator.getCurrentPage();
    $scope.kid = page.options.kid;    
    $scope.spinner = spinner;    
    
    $scope.notes = function(){
        var options = {
          animation: 'slide',
          kid: $scope.kid
        };
        myNavigator.pushPage("notes.html", options);
    };
    
    
    $scope.email = function(){
        var options = {
          animation: 'slide',
          kid: $scope.kid
        };
        myNavigator.pushPage("email.html", options);
    };
    
    $scope.contacts = function(){
        var options = {
          animation: 'slide',
          kid: $scope.kid
        };
        myNavigator.pushPage("contacts.html", options);
    };
    
    $scope.allphotos = function(){
        var options = {
          animation: 'slide',
          kid: $scope.kid
        };
        myNavigator.pushPage("allphotos.html", options);
    };
     
    
   var win = function (r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
        $scope.spinner.on = false;
        alert("Photo uploaded successfully.");
    }
    
    var upload = function(fileUrl){  
        var userToken = Firebase.getAuth().token;
        console.log('uploading');
        var options = new FileUploadOptions();
        options.name = fileUrl.substr(fileUrl.lastIndexOf('/') + 1);                
        options.fileName = options.name;
        options.mimeType = "image/jpeg";
        options.chunkedMode = false;
        
        var params = {};
        params.fileKey = options.name;
        params.userToken = userToken;
        options.params = params; // eig = params, if we need to send parameters to the server request
        var headers={usertoken:userToken, kidid: $scope.kid.key, familykey: $scope.kid.family};
        options.headers = headers;
        console.log(headers.usertoken);
        console.log(headers.kidid);
        console.log(headers.familykey);
            
        ft = new FileTransfer();        
        ft.upload(fileUrl, "http://cheeche-uploader.azurewebsites.net/upload", win, function(error){
            console.log("upload error source " + error.source);
            console.log("upload error target " + error.target);
            console.log("Retry");
            upload(fileUrl);            
        }, options); 
        //ft.upload(fileUrl, "http://192.168.1.14:1337/upload", win, fail, options); 
        
    }
    
    $scope.takePic= function show_pic() {        
       navigator.camera.getPicture(function(fileURL){
           console.log(fileURL);
           $scope.spinner.on = true; 
           upload(fileURL);
        }, function(error){
           console.log(error);           
        }, {  quality : 50,
              destinationType : Camera.DestinationType.FILE_URI,                                          
              saveToPhotoAlbum: true,              
              correctOrientation: true
        });
    };
    
    $scope.uploadPic = function () {
        //Specify the source to get the photos.
        navigator.camera.getPicture(function(fileUrl){
           console.log(fileUrl);
           $scope.spinner.on = true; 
           upload(fileUrl);
        }, function(error){
            console.log(error);
        }, 
          { quality: 50,destinationType: Camera.DestinationType.FILE_URI,
          sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY });
      }
});

myApp.service('Firebase', function(){
    var myFirebaseRef = new Firebase("https://cheechetimes.firebaseio.com/");    
    return myFirebaseRef;
});

myApp.service('spinner', function(){
    this.on = false;
    return this;
});

myApp.service('localStorage', function(){
    
    var getByKey = function(key){
        var item = localStorage.getItem(key); 
        return JSON.parse(item);
    };
    
    var setItemByKey = function(key, item){
        item = JSON.stringify(item);
        localStorage.setItem(key, item);
    };
    
    var removeItemByKey = function(key){
        localStorage.removeItem(key);
    };
    
    return {
        getByKey: getByKey,
        setItemByKey: setItemByKey,
        removeItemByKey: removeItemByKey
    };
});

myApp.service('User', function(Firebase, $q, localStorage){
    var loginKey = 'LOGINKEY';
    var self = this;
    
    self.userInfo = Firebase.getAuth(); 
       
    self.loginUser = function(email, password, rememberMe){
        var deferred = $q.defer();

        Firebase.authWithPassword({
          email    : email,
          password : password,
        }, function(error, authData) { 
            if(error){
                deferred.reject(error);
            }else{
                Firebase.child("users").child(authData.uid).on('value', function(snapshot){
                    self.userInfo = snapshot.val();
                    if(rememberMe){
                        localStorage.setItemByKey(loginKey, {email: email, password: password});    
                    }                    
                    deferred.resolve(self.userInfo);   
                });  
            }
          
        }, {
          remember: "sessionOnly"
        });
         
        return deferred.promise;
    };
    
    self.logOut = function(){
        Firebase.unauth();
        self.userInfo = null;
        localStorage.removeItemByKey(loginKey);
    }
    
    self.getLocalUser = function(){
        return localStorage.getByKey(loginKey);
    }
    
    return self;
});



