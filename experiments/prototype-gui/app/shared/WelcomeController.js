angular
.module('test')
//.constant('Objective', 'I am an aspiring backend / frontend / full-stack software developer who enjoys discovering technologies, both modern and legacy. I am currently seeking employment as a software developer in an environment which fosters sound development practices, and hope to find an organization that would help me find a path to an expertise, while learning new skills and keeping my current ones sharp.')
.constant('Objective', 'I am currently happily employed at the National Center for Supercomputing Applications. I am not seeking new opportunities at this time.')
.constant('AboutMe', 'In my spare time, I enjoy playing guitar and singing. Although I have no formal musical training, I have always enjoyed creating and mixing music. I have also been known to enjoy playing complicated games, such as EverQuest and MineCraft, that allow me to apply my knowledge of the mysterious inner workings of software to refine my gameplay strategies. Along with this web server, I also host MineCraft and Ventrilo servers on my desktop PC, but they do not see much traffic.')
.constant('CurrentLocation', {
    name: 'Mike Lambert',
    address: '211 Avondale Ave.',
    city: 'Champaign',
    stateOrProvince: 'IL',
    country: 'U.S.A.'
  })
.constant('ExternalLinks', 
  [
      {
        id: 1,
        url: 'https://docs.google.com/document/d/1yzL20ROQ-d8CzotR3PxFdDt-Umxf55ctmo-59Br1TfI/edit?usp=sharing',
        icon: 'fa-paperclip',
        description: 'Take a look at my resume'
      },
      {
        id: 2,
        url: 'https://www.linkedin.com/profile/view?id=AAMAABLekqYBel4DCXNl29GOaEj893oJx-WlzbE&trk=hp-identity-name',
        icon: 'fa-linkedin-square',
        description: 'Connect with me on LinkedIn'
      },
      {
        id: 3, 
        url: 'http://twitch.tv/bodom0015',
        icon: 'fa-twitch',
        description: 'Follow me on Twitch.tv'
      },
      {
        id: 4,
        url: 'https://facebook.com/wesker514',
        icon: 'fa-facebook-square',
        description: 'Friend me on FaceBook'
      },
      /*{
        id: 5, 
        url: 'https://plus.google.com/u/0/115232412060785281798/posts',
        icon: 'fa-google-plus-square',
        description: 'Add me to your circles on Google+'
      },*/
      {
        id: 6,
        url: 'https://github.com/bodom0015',
        icon: 'fa-github-square',
        description: 'Check out some of my code samples on GitHub'
      },
      {
        id: 7,
        url: 'https://twitter.com/bodom0015',
        icon: 'fa-twitter-square',
        description: 'Follow me on Twitter'
      }
  ])
.constant('PrimaryLanguages', [
    {
      id: 'JS',
      name: 'JavaScript',
      experience: 'For the past year or so, I have been learning JavaScript partially at work and partially in my own free time. I taught myself JavaScript while architecting the new web platform for Pavlov Media, during which I worked very heavily with jQuery, Grunt, Bower, and NPM. We went on to produce several applications using this platform such as the new version of our company\'s flagship product, a network gateway configuration interface, a real-time chat client using WebSockets, and a file-share manager. Most of these products were not customer facing, but it was still important to me that they were always functional and if not appealing at least not painful to view. Since then I have primarily worked in AngularJS / Bootstrap, and to a lesser degree other frameworks such as DurandalJS, Polymer, and D3.'
    },
    {
      id: 'JVM',
      name: 'Java / Groovy',
      experience: "I learned Java over a weekend in college for Software Engineering I. We went on to develop a very simple custom plugin for the Eclipse refactoring engine for the class, including all of the necessary formal documentation. I developed some simple Bayesian machine learning programs for an Artificial Intelligence course later on. Just before I graduated, I got a job at Pavlov Media as a Java Developer. I started out producing unit tests for their in-house billing and provisioning solution. I was trained to locate inefficiencies in Java code, and rewrote or created new backend components that solved problems we had found. I taught myself Groovy as well to create several one-off scripts that accessed the MySQL databases that the Java code wrapped around."
    },
    {
      id: 'CSharp',
      name: 'Visual C#',
      experience: 'Being slightly familiar with .NET from my days long ago in Visual Basic, I learned C# on the job at Pavlov Media in order to develop and maintain the new version of their technical support and management interface. This introduced me to concepts like MVVM and DI, and I quickly learned how to bind to variables in XAML, deal with delegates and events, and document everything very thoroughly along the way. I went on to become the sole maintainer and primary contributor for this interface. Toward the end of my tenure, I took over maintenance of the C# ASP.NET bridge which served data from the running Microsoft CRM 2011 Customer Ticketing system to our JavaScript web portals, but I departed the company shortly thereafter and did not have the opportunity to learn intricacies of the framework and code.'
    },
  ])
.constant('OtherSkills', [
    {
      id: 'webjscss',
      name: 'AngularJS / Bootstrap',
      experience: 'This website is written almost entirely in AngularJS and Bootstrap, with some integration between the two in the form of UI-Bootstrap and some custom directives.'
    },
    {
      id: 'webStack',
      name: 'NPM / Bower',
      experience: "These two dependency management technologies were also used in the construction of this website."
    },
    {
      id: 'grunt',
      name: 'Grunt',
      experience: "I also have some slight professional experience with integrating Grunt tasks, like minifying / uglifying output files and copying them to the correct location(s)."
    },
    {
      id: 'd3',
      name: 'D3',
      experience: "I very recently started experimenting with integrating AngularJS and D3 in order to adapt some interesting visualizations to my website: <ul><li><a href='#/everquest/regions/#graphFrame'>Circle Packing</a></li><li><a href='#/everquest/lore/#graphFrame'>Timeline</a></li></ul>NOTE: I did not create the graphs themselves, but I did adapt them to be AngularJS directives."
    },
    {
      id: 'maven',
      name: 'Maven',
      experience: 'I learned Maven on the job and used it to build most of the Java and C# projects that we produced. In doing so, I explored creating Maven archetypes for common Java and C# Maven project types.'
    },
    {
      id: 'git',
      name: 'Git',
      experience: 'I learned Git for some Java / Objective-C projects back in college and bolstered my understanding of it while on the job at Pavlov Media.'
    },
    {
      id: 'svn',
      name: 'SVN',
      experience: 'I used SVN for several projects (mostly C / C++) back in college, but have not really used it since being introduced to Git.'
    },
    {
      id: 'php',
      name: 'PHP',
      experience: 'No professional experience here either, but I have played around in PHP enough to be familiar with the general syntax and understand a bit of the inner workings. The <a href="/minecraft/legacy.php">original version of this very website</a> was written in PHP, and lacked styling (a skill that I had not learned yet).'
    },
    {
      id: 'c',
      name: 'C / C++ / x86 Assembly',
      experience: 'While I have very little professional experience with C or C++, I have developed in both fairly heavily in an educational context, including: <ul><li>Custom Linux Kernel/Shell, including SysCalls and hardware drivers</li><li>OpenGL Flight Simulator</li></ul>'
    },
    {
      id: 'lua',
      name: 'Lua',
      experience: 'I have very little experience with Lua, but a couple of games that I play allow me to script out actions using Lua syntax. This allows me to do things like send a machine to go mine things for me in MineCraft.'
    },
    {
      id: 'mathematica',
      name: 'Mathematica',
      experience: 'While I haven\'t used this skill in awhile, I have taken several classes involving using Mathematica to solve and graph complex equations: <ul><li>Calculus III</li><li>Differential Equations</li><li>Applied Linear Algebra</li></ul>'
    },
    {
      id: 'basic',
      name: 'Visual Basic',
      experience: 'My introduction to programming was through a course I took during high school. The cirriculum was taught in Visual Basic, and the go-getters like myself who finished early were given C or C++ syntax to look over and attempt to decipher. While I have not worked in Visual Basic since that class (I prefer C# now), I have worked with it before in an eductional context.'
    }
  ])
.constant('EmploymentHistory', [
    { 
      name: 'National Center for Supercomputing Applications',
      jobTitle: 'Research Programmer',
      startDate: 'Jan 2016',
      endDate: 'Present',
      summary: '',
      responsibilities: []
    },
    { 
      name: 'Pavlov Media',
      jobTitle: 'Systems Developer',
      startDate: 'Nov 2012',
      endDate: 'May 2015',
      summary: 'Over the course of my employment, I learned the intricacies of Java 7/8, Groovy, C#, and JavaScript. As a Systems Developer, I wrote and rewrote systems components, thoroughly documented large segments of the codebase, filed detailed bug reports, suggested performance improvements, and supported cross-departmental operations relevant to our software. I also wrote the end-to-end test plan for the billing and provisioning system, which I then used to thoroughly test the software before each major release and file a list of bugs along with the use cases they affected.',
      responsibilities: [
        'Contributed to and maintained a large-scale distributed billing and provisioning system written in Java',
        'Enumerated and executed user lifecycle test cases for the aforementioned system',
        'Authored JavaScript and C# Silverlight front-end web portals for internal company use that talked to the backend Java platform',
        'Analyzed and refactored multi-threaded legacy code to be more efficient and readable',
        'Cross-trained team members on the usage of our technology stacks, both new and legacy',
        'Provided intracompany documentation and interdepartmental technical support for our department\'s products',
        'Administrated and monitored production system logs to ensure smooth performance of the overall system'
      ]
    },
  ])
.constant('Education', { 
    name: 'University of Illinois, Champaign',
    degreeType: 'Bachelor of Science (B.S.)',
    major: 'Computer Engineering',
    minor: 'Mathematics',
    startDate: 'Aug 2008',
    endDate: 'Dec 2012',
    relevantCoursework: [
      {
        name: 'Interactive Computer Graphics',
        id: 'CS 418',
      },
      {
        name: 'Software Engineering I / II',
        id: 'CS 427 / 429',
      },
      {
        name: 'Applied Linear Algebra',
        id: 'MATH 415',
      },
      {
        name: 'Computer Organization & Design',
        id: 'ECE 411',
      },
      {
        name: 'Computer Systems Engineering',
        id: 'ECE 391',
      },
      {
        name: 'Theory of Computation',
        id: 'CS 373',
      },
      {
        name: 'Artificial Intelligence',
        id: 'CS 448',
      },
      {
        name: 'Computer Security I',
        id: 'CS 422',
      }
    ]
  })
.constant('Certifications', [
    {
      id: 'mtcna',
      name: 'MikroTik Certified Network Associate',
      validFrom: 'Oct. 11, 2013',
      validTo: 'Oct. 11, 2016',
      imgLink: 'https://www.mikrotik.com/training/certificates/b20407cb4a238c387d0',
      number: '1310NA208'
    },
    {
      id: 'mtctce',
      name: 'MikroTik Certified Traffic Control Engineer',
      validFrom: 'Oct. 11, 2013',
      validTo: 'Oct. 11, 2016',
      imgLink: 'https://www.mikrotik.com/training/certificates/b20442cc37cada2bb8f',
      number: '1310TCE023'
    }
  ])
.directive('bsPopover', function() {
   return function(scope, elem) {
      elem.popover({html:true});
   }
})
.filter('addTheToCountry', [ '$sce', function($sce) {
    return function(text) {
      if (angular.uppercase(text) === text) {
        return 'the ' + text;
      }
      return text;
    };
}])
.controller('WelcomeController', [ '$scope', '$location', 'appConfig', '$document', 'EmploymentHistory', 'Objective', 'CurrentLocation', 'Education', 'PrimaryLanguages', 'OtherSkills', 'Certifications', 'ExternalLinks', 'AboutMe',  function($scope, $location, appConfig, $document, EmploymentHistory, Objective, CurrentLocation, Education, PrimaryLanguages, OtherSkills, Certifications, ExternalLinks, AboutMe) {
  $scope.appConfig = appConfig;
  appConfig.title = "Personal Resume Website";
  appConfig.path = "welcome/";
  
  // Set up all these bindings from constant data
  $scope.arrowPointsDown = true;
  $scope.aboutMe = AboutMe;
  $scope.objectiveStatement = Objective;
  $scope.education = Education;
  $scope.employmentHistory = EmploymentHistory;
  $scope.primaryLanguages = PrimaryLanguages;
  $scope.skillList = OtherSkills;
  $scope.currentAddress = CurrentLocation;
  $scope.certs = Certifications;
  $scope.links = ExternalLinks;
  
  // Enable smooth scroll on anchor navigate
  $(function() {
    $('a[href*=#]:not([href=#])').click(function() {
      if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
        var target = $(this.hash);
        target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
        if (target.length) {
          $('html,body').animate({
            scrollTop: target.offset().top
          }, 1000);
          return false;
        }
      }
    });
  });
  
  // Parallax scroll effects
  $(document).ready(function(){
   // cache the window object
   $window = $(window);
 
   $('section[data-type="background"]').each(function(){
     // declare the variable to affect the defined data-type
     var $scroll = $(this);
                     
      $(window).scroll(function() {
        // HTML5 proves useful for helping with creating JS functions!
        // also, negative value because we're scrolling upwards                             
        var yPos = -($window.scrollTop() / $scroll.data('speed')); 
         
        // background position
        var coords = '50% '+ yPos + 'px';
 
        // move the background
        $scroll.css({ backgroundPosition: coords });    
      }); // end window scroll
   });  // end section function
}); // close out script
  
  // Watch the scroll location to change the arrow direction
  angular.element(document).ready(function () {
      $document.on('scroll', function() {
      var left = $document.scrollLeft();
      var top = $document.scrollTop();
      $scope.$apply(function() {
        if (top < 275) {
          $scope.arrowPointsDown = true;
        } else {
          $scope.arrowPointsDown = false;
        }
        console.log(left + ", " + top)
      });
    });
  }); 
}])