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
  posts: DS.hasMany('post', { async: true }) // misspelled on purpose!!!!! HACK TO-DO
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
    Ember.Object.create({ latitude: -33.86781, longitude: 151.20754 }), // Sydnet
    Ember.Object.create({ latitude: -27.4679, longitude: 153.0278}), 
    Ember.Object.create({ latitude: -27.4984, longitude: 152.9712}) // Sydnet
  ]
});

App.IssueRoute = Ember.Route.extend(Ember.UserApp.ProtectedRouteMixin, {
  model: function(params){
      return Ember.RSVP.hash({
        issue: this.store.find('issue', params.issueID),
        markers: []
      });
  },
  afterModel: function(m){




    return m.issue.get('posts').then(function(a){
      // Loop through promisessssss results
    //    a.forEach(function(post){
    //     // debugger;
    //     var lat = +JSON.parse(JSON.stringify(post.get('latitude')));
    //     var lon = +JSON.parse(JSON.stringify(post.get('longitude')));
    //     markerObject = Ember.Object.create({
    //       latitude: lat,
    //       longitude: lon
    //     });
    //     // m.markers.addObject(markerObject);
    //     m.markers.pushObject(markerObject);


    // //     debugger;
    //     m.markers =     [
    // Ember.Object.create({ latitude: 50.08703, longitude: 14.42024 }),
    // Ember.Object.create({ latitude: 50.08703, longitude: 14.42024 }),  // Prague
    // Ember.Object.create({ latitude: 40.71356, longitude: -74.00632 }), // New York
    // Ember.Object.create({ latitude: -33.86781, longitude: 151.20754 }) // Sydnet
    // ];


    // set content
    m.markers = a.content;
      // });

       return m;
    })
  }
});
App.IssueController = Ember.ObjectController.extend({
  selectedLocation: {
    latitude: "-27.4679",
    longitude: "153.0278",
  }
});

App.NewissueController = Ember.Controller.extend({
    issueTitle: "Issue title",
    issueContent: "Issue brief description",
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
  radius: 0,
  updateTrigger: function(){
    //gmaps code to set new cordinates
    // debuggfer;
    var latitude = this.get('latitude');
    var longitude = this.get('longitude');
    this.$('#picker-latitude').val(latitude);
    this.$('#picker-longitude').val(longitude);
  }.observes('latitude', 'longitude'),
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
        console.log("Location changed. New location (" + currentLocation.latitude + ", " + currentLocation.longitude + ")");
      }
    }

    //initialise location picker
    container.locationpicker(options);
  }.on('didInsertElement')
});

App.GoogleMapsComponent = Ember.Component.extend({
  classNames: ['fullscreen'],
  longitude: '',
  latitude: '',
  markers: '',
  map: '',
  insertMap: function() {
    var guid = (function() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
      }
      return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
               s4() + '-' + s4() + s4() + s4();
      };
    })();

    var id = guid()
    var container = this.$('.map-canvas').attr('id', id);

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

    // var map = new GMaps({
    //   div: "#" + id,
    //   lat: this.get('latitude'),
    //   lng: this.get('longitude')
    // });

    // this.set('map', map);
    this.setMarkers();
  }.on('didInsertElement'),

  // coordinatesChanged: function() {
  //   var map = this.get('map');
  //   if (map)
  //     map.setCenter(this.get('longitude'), this.get('latitude'));
  // }.observes('latitude', 'longitude'),

  setMarkers: function() {
    var map = this.get('map'),
      markers = this.get('markers'),
      markerCache = this.get('markerCache');


    if (markers){
      // markerCache.forEach(function(marker) { marker.setMap(null); }); // Remove all existing markers

      // debugger;
      markers.forEach(function(marker){
        var gMapsMarker = new google.maps.Marker({
          position: new google.maps.LatLng(marker.get('latitude'), marker.get('longitude')),
          map: map
        });
        // debugger
      // map.addMarker({
      //   lat: marker.get('latitude'),
      //   lng: marker.get('longitude'),
      //   title: 'Lima',
      //   click: function(e) {
      //     alert('You clicked in this marker');
      //   }
      // });

        // markerCache.pushObject(gMapsMarker); // Add this marker to our cache
      }, this);
    }
  }.observes('markers.@each.latitude', 'markers.@each.longitude', "markers")
});

App.NewpostRoute = Ember.Route.extend(Ember.UserApp.ProtectedRouteMixin, {
  model: function(params){
    return this.store.find('issue', params.issueID);
  }
});
App.NewpostController = Ember.Controller.extend({
  postTitle: "Your title",
  postContent: "Description",
  radius: "100",
  latitude: "-27.4865767", //default coordinates to Brisbane
  longitude: "153.0278",
  latitudeSetter: function() {
    var _this = this;

    navigator.geolocation.getCurrentPosition(function(position) {
      coords = position.coords
      console.log(coords);
      _this.set('latitude', coords.latitude);
      _this.set('longitude', coords.longitude);
    });
  }.on('init'),
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
          latitude: _this.get('latitude'),
          longitude: _this.get('longitude'),
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

// make sure this is ember handlebars
Ember.Handlebars.helper("formatDate", function(datetime, format) {
  var DateFormats = {
       short: "DD MMMM - YYYY",
       long: "dddd DD.MM.YYYY HH:mm"
  };
    if (moment) {
      f = DateFormats[format];
      // some date strings are in ms
      return moment(datetime*1000).format(f);
    }
    else {
      return datetime;
    }
});

});