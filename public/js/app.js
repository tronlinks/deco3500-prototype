$(function(){

// new GMaps({
//   div: '#map',
//   lat: -12.043333,
//   lng: -77.028333
// });


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

App = Ember.Application.create();

App.ApplicationAdapter = DS.FirebaseAdapter.extend({
  firebase: new Firebase("https://grapevinecom.firebaseio.com/")
});


App.Post = DS.Model.extend({
  title: DS.attr(''),
  // content: DS.attr(''),
  // created: DS.attr(''),
  // updated: DS.attr(''),
  // // uid: DS.attr(''),
  // // user: DS.attr(''),
  // tags: DS.attr('', {defaultValue: ''}),
  location: DS.attr('', {defaultValue: ''}),
  radius: DS.attr('', {defaultValue: ''}),
  // likes: DS.attr('', {defaultValue: 0}),
  // views: DS.attr('', {defaultValue: 0}),
  issue: DS.belongsTo('issue', { async: true })
});

App.Issue = DS.Model.extend({
  title: DS.attr(''),
  // content: DS.attr('', {defaultValue: ''}),
  // created: DS.attr(''),
  // updated: DS.attr(''),
  // uid: DS.attr(''),
  // user: DS.attr(''),
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
  
App.IssueRoute = Ember.Route.extend(Ember.UserApp.ProtectedRouteMixin, {
  model: function(params){
    return this.store.find('issue', params.issueID);
  }
});
App.NewissueController = Ember.Controller.extend({
    title: "issue title",
    actions: {
      createIssue: function(){
        
          var _this = this;
          
          // Create new Issue
          var newIssue = _this.store.createRecord('issue', {
            title: _this.get('title'),
            created: moment().unix(),
            updated: moment().unix(),
            uid: _this.get('user').current.user_id,
            user: _this.get('user').current
          });

          // Save it to firebase
          newIssue = newIssue.save();

          // Check if succesfull :)
          newIssue.then(function(a){
            alert('success')
          }, function(a){
            debugger;
            alert('failure');
          })

      }
    }
})


App.LocationPickerComponent = Ember.Component.extend({
  latitude: 0,
  longitude: 0,
  radius: 300,
  chooseDate: function() {
    var _this = this;
    var container = _this.$('#location-picker');

    var options = {
      location: {
        latitude: _this.get('latitude'),
        longitude: _this.get('longitude')
      },
      radius: _this.get('radius'),
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

    container.locationpicker(options);

  }.on('didInsertElement')
})

App.GoogleMapsComponent = Ember.Component.extend({
  insertMap: function() {
    var container = this.$('.map-canvas');

    var options = {
      center: new google.maps.LatLng(this.get('latitude'), this.get('longitude')),
      zoom: 17,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    this.set('map', new google.maps.Map(container[0], options));
    this.set('markerCache', []);

    this.setMarkers();
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
    postTitle: "enter title here",
    postContent: "enter content here",
    radius: "300",
    latitude: "0",
    longitude: "0",
    actions: {
      createPost: function(){
          var _this = this;

          this.store.find('issue', this.get('model.id')).then(function(issue){

            // debugger;

            //create new Post
            var newPost = _this.store.createRecord('post', {
                title: _this.get('postTitle'),
                issue: issue,
                radius: _this.get('radius')

                // TO DO

                add location herere 


                // content: _this.get('postContent'),
                // created: moment().unix(),
                // updated: moment().unix(),
                // uid: _this.get('user').current.user_id,
                // user: _this.get('user')
            });

            //save it to firebase
            var newPostPromise = newPost.save();
            // newPost.save();
            
            //add to the issue

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
          //this.get('model') is the issue
          // debugger;

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
})

});