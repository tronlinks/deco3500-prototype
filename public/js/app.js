$(function(){

//Initialise UserApp (user management)
Ember.Application.initializer({
  name: 'userapp',
  initialize: function(container, application) {
    Ember.UserApp.setup(application, { 
      appId: '543519ac41525',
      loginRoute: 'login',
      indexRoute: 'index',
      heartbeatInterval: 20000,
      usernameIsEmail: false
    });
  }
});

//Initialise Ember (MVC)
App = Ember.Application.create();

//Initialise Firebase (database)
App.ApplicationAdapter = DS.FirebaseAdapter.extend({
  firebase: new Firebase("https://grapevinecom.firebaseio.com/")
});

App.Post = DS.Model.extend({
  title: DS.attr(''),
  content: DS.attr(''),
  created: DS.attr(''),
  updated: DS.attr(''),
  uid: DS.attr(''),
  user: DS.attr(''),
  // tags: DS.attr('', {defaultValue: ''}),
  longitude: DS.attr(''),
  latitude: DS.attr(''),
  radius: DS.attr(''),
  likes: DS.attr('', {defaultValue: 0}),
  issue: DS.belongsTo('issue', { async: true })
});

App.Issue = DS.Model.extend({
  title: DS.attr(''),
  content: DS.attr(''),
  created: DS.attr(''),
  updated: DS.attr(''),
  uid: DS.attr(''),
  user: DS.attr(''),
  posts: DS.hasMany('post', { asyn: true }) // misspelled on purpose!!!!! HACK TO-DO
});

App.Router.map(function() {
  this.route('index', {path: "/"});

  this.route('login');
  this.route('signup');

  this.route('issue', {path: "issue/:issueID"})
  this.route('newpost', {path: "issue/newpost/:issueID"});
  this.route('newissue');
});

//for User App
App.ApplicationRoute = Ember.Route.extend(Ember.UserApp.ApplicationRouteMixin);
App.SignupController = Ember.Controller.extend(Ember.UserApp.FormControllerMixin);
App.LoginController = Ember.Controller.extend(Ember.UserApp.FormControllerMixin);

App.IndexRoute = Ember.Route.extend(Ember.UserApp.ProtectedRouteMixin, {
  model: function(){
    return this.store.find('issue');
  }
});
App.IndexController = Ember.Controller.extend({
  selectedLocation: {
    latitude: "-27.4679",
    longitude: "153.0278",
  },
  markers: [
    //code for an array of issue coordinates
  ]
});
  
App.IssueRoute = Ember.Route.extend(Ember.UserApp.ProtectedRouteMixin, {
  model: function(params){
    return this.store.find('issue', params.issueID);
  }
});
App.IssueController = Ember.ObjectController.extend({
  selectedLocation: {
    latitude: "-27.4679",
    longitude: "153.0278",
  },
  markers: [
    //code for an array of issue coordinates
  ]

  // function() {
  //   var array = []
  //   // debugger;
  //   this.get('model').get('posts').forEach(function(post){
  //     console.log(post.get('latitude'), post.get('longitude'));
  //     markerObject = Ember.Object.create({
  //       latitude: post.get('latitude'),
  //       longitude: post.get('longitude')});
  //     array.addObject(markerObject);
  //   });

  //   return array
  // }.property()

    // [
    // Ember.Object.create({ latitude: 50.08703, longitude: 14.42024 }),
    // Ember.Object.create({ latitude: 50.08703, longitude: 14.42024 }),  // Prague
    // Ember.Object.create({ latitude: 40.71356, longitude: -74.00632 }), // New York
    // Ember.Object.create({ latitude: -33.86781, longitude: 151.20754 }) // Sydnet
    // ]
});

App.NewissueController = Ember.Controller.extend({
    issueTitle: "issue title",
    issueContent: "issue brief description",
    actions: {
      createIssue: function(){
        
        var _this = this;
        
        // Create new Issue
        var newIssue = _this.store.createRecord('issue', {
          title: _this.get('issueTitle'),
          content: _this.get('issueContent'),
          created: moment().unix(),
          updated: moment().unix(),
          uid: _this.get('user').current.user_id,
          user: _this.get('user').current
        });

        // Save to firebase
        newIssue = newIssue.save();

        // Check if succesfull :)
        newIssue.then(function(a){
          console.log('created issue successful');
        }, function(a){
          console.log('created issue unsuccessful');
          debugger;
        })
        
        //redirect back to issues page
        this.transitionTo('index');
      }
    }
});

App.LocationPickerComponent = Ember.Component.extend({
  latitude: 0,
  longitude: 0,
  radius: 300,
  chooseLocation: function() {
    var _this = this;
    var container = _this.$('#location-picker');

    var options = {
      location: {
        latitude: _this.get('latitude'),
        longitude: _this.get('longitude')
      },
      radius: _this.get('radius'),
      zoom:14,
      inputBinding: {
        latitudeInput: _this.$('#picker-latitude'),
        longitudeInput: _this.$('#picker-longitude'),
        radiusInput: _this.$('#picker-radius'),
        locationNameInput: _this.$('#picker-address')
      },
      enableAutocomplete: true,
      onchanged: function(currentLocation, radius, isMarkerDropped) {
        _this.set('latitude', currentLocation.latitude);
        _this.set('longitude', currentLocation.longitude);
        _this.set('radius', radius);
        // console.log("Location changed. New location (" + currentLocation.latitude + ", " + currentLocation.longitude + ")");
      }
    }

    //initialise location picker
    container.locationpicker(options);

  }.on('didInsertElement')
});

App.GoogleMapsComponent = Ember.Component.extend({
  classNames: ['fullscreen'],
  insertMap: function() {
    var container = this.$('.map-canvas');

    var options = {
      center: new google.maps.LatLng(
          this.get('latitude'), 
          this.get('longitude')
        ),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    this.set('map', new google.maps.Map(container[0], options));
    this.set('markerCache', []);

    // this.setMarkers();
  }.on('didInsertElement'),
  
  coordinatesChanged: function() {
    var map = this.get('map');

    if (map) map.setCenter(new google.maps.LatLng(this.get('latitude'), this.get('longitude')));
  }.observes('latitude', 'longitude'),
  
  setMarkers: function() {
    var map = this.get('map'),
      markers = this.get('markers'),
      markerCache = this.get('markerCache');

    if (markers){
      markerCache.forEach(function(marker) { marker.setMap(null); }); // Remove all existing markers

      // debugger;
      markers.forEach(function(marker){
        var gMapsMarker = new google.maps.Marker({
          position: new google.maps.LatLng(marker.get('latitude'), marker.get('longitude')),
          map: map
        });

        markerCache.pushObject(gMapsMarker); // Add this marker to our cache
      }, this);
    }
  }.observes('markers.@each.latitude', 'markers.@each.longitude')
});

App.NewpostRoute = Ember.Route.extend(Ember.UserApp.ProtectedRouteMixin, {
  model: function(params){
    return this.store.find('issue', params.issueID);
  }
});
App.NewpostController = Ember.Controller.extend({
  postTitle: "Enter title here",
  postContent: "Enter content here",
  radius: "100",
  latitude: function() {
    var result = 0
    var geolocatePromise = navigator.geolocation.getCurrentPosition(function(position) {
      result = position.coords.latitude
      console.log(result); 
    });
    // geolocatePromise.then(function() {
    //   return result;
    // });
return -27.4865767
  }.property(),
  longitude: function() {
    result = 0
    return 153.0278}.property(),
  // latitude: function() {
  //   var lat;
  //   navigator.geolocation.getCurrentPosition(function(position) {
  //     console.log(position.coords.latitude);
  //     lat = position.coords.latitude 
  //   });
  //     return lat 
  // }.property,
  // longitude: function() {
  //   navigator.geolocation.getCurrentPosition(function(position) {
  //     return 153.0278
  //     console.log(position.coords.longitude);
  //   })
  // }.property,
  // latitude: this.geoLocate('longitude'),
  // longitude: this.geoLocate('latitude'),
  // geoLocate: function(direction) {
  //   navigator.geolocation.getCurrentPosition(function(position, direction) {
  //     return position.coords.direction
  //   });
  // },
  actions: {
    createPost: function(){
      var _this = this;

      this.store.find('issue', this.get('model.id')).then(function(issue){
        //create new Post
        var newPost = _this.store.createRecord('post', {
          title: _this.get('postTitle'),
          content: _this.get('postContent'),
          created: moment().unix(),
          updated: moment().unix(),
          uid: _this.get('user').current.user_id,
          user: _this.get('user').current,
          // tags: DS.attr('', {defaultValue: ''}),
          longitude: _this.get('latitude'),
          latitude: _this.get('longitude'),
          radius: _this.get('radius'),
          // likes: DS.attr('', {defaultValue: 0}),
          issue: issue
        });

        //save post to firebase
        var newPostPromise = newPost.save();
        
        //add post to the issue and save to firebase
        newPostPromise.then(function(){
          issue.get('posts').addObject(newPost);
          var modelPromise = issue.save()
          modelPromise.then(function(){
            // debugger;
          }, function(argument) {
            debugger;                
          });
        })
      })
      
      //redirect to the issue page
      this.transitionTo('issue', _this.get('model.id'));

      // If successful, add to issue and save issue
      //   newPostPromise.then(function(a){
      //     alert('success')
      //   }, function(a){
      //     alert('failure');
      //   })

      // // Check if succesfull :)
      // modelPromise.then(function(a){
      //   alert('success')
      // }, function(a){
      //   alert('failure');
      // })
    }
  }
});

// Ember.Handlebars.registerBoundHelper('formattedUnixDate', function(format) {
//   unixDate = this.get('model.')
//   return moment().format(format);
// });

});