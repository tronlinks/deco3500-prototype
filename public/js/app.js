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

App.Router.map(function() {
    this.route('login');
    this.route('signup');
    // this.route('index');
});

App.ApplicationRoute = Ember.Route.extend(Ember.UserApp.ApplicationRouteMixin, {

});
App.SignupController = Ember.Controller.extend(Ember.UserApp.FormControllerMixin);
App.LoginController = Ember.Controller.extend(Ember.UserApp.FormControllerMixin);
App.IndexRoute = Ember.Route.extend(Ember.UserApp.ProtectedRouteMixin, {
  model: function(){
    return '';
  }
});
  



App.ApplicationAdapter = DS.FirebaseAdapter.extend({
  firebase: new Firebase("https://grapevinecom.firebaseio.com/")
});


App.Post = DS.Model.extend({
  title: DS.attr(''),
  uid: DS.attr(''),
  user: DS.attr(''),
  created: DS.attr(''),
  updated: DS.attr(''),
  content: DS.attr(''),
  tags: DS.attr(''),
  location: DS.attr(''),
  likes: DS.attr(''),
  views: DS.attr(''),
  issue: DS.belongsTo('issue', { async: true })
});

App.Issue = DS.Model.extend({
  title: DS.attr(),
  created: DS.attr(''),
  updated: DS.attr(''),
  uid: DS.attr(''),
  user: DS.attr(''),
  posts: DS.hasMany('post', { async: true })
});


    //   $(window).resize(function () {
    //       var h = $(window).height(),
    //         offsetTop = 150; // Calculate the top offset
		
    
    //       $('#map_canvas').css('height', (h - offsetTop ));
		  // $('#content').css('height', (h - offsetTop + 18));
		  // $('#subcontent').css('height', (h - offsetTop + 12));
    //     }).resize();
        
    //     $(function() {
    //       MapsLib.initialize();
    //       $("#search_address").geocomplete();

    //       $(':checkbox').click(function(){
    //         MapsLib.doSearch();
    //       });

    //       $(':radio').click(function(){
    //         MapsLib.doSearch();
    //       });
          
    //       $('#search_radius').change(function(){
    //         MapsLib.doSearch();
    //       });
          
    //       $('#search').click(function(){
    //         MapsLib.doSearch();
    //       });
          
    //       $('#find_me').click(function(){
    //         MapsLib.findMe(); 
    //         return false;
    //       });
          
    //       $('#reset').click(function(){
    //         $.address.parameter('address','');
    //         MapsLib.initialize(); 
    //         return false;
    //       });
          
    //       $(":text").keydown(function(e){
    //           var key =  e.keyCode ? e.keyCode : e.which;
    //           if(key == 13) {
    //               $('#search').click();
    //               return false;
    //           }
    //       });
    //     });