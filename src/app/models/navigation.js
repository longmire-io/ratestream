export const navigation = {
  brand:      'Longmire',
  leftLinks:  [],
  rightLinks: [
    {
      label:      'Home',
      link:       '/',
      view:       'home',
      isRouteBtn: true
    },
    {
      label:      'About',
      link:       '/about',
      view:       'about',
      isRouteBtn: true
    }
  ],
  sideMenu: [
    { // group menu #1
      id: 1,
      group: 'Analyst',
      menus: [
        {
          name: 'Dashboard',
          linkTo: '/',
          faIconName: 'fa-server'
        },
        {
          name: 'Scheduling',
          linkTo: '/scheduling',
          faIconName: 'fa-eye'
        },
        {
          name: 'Statuses',
          linkTo: '/status',
          faIconName: 'fa-gear'
        }
      ]
    },
    { // group menu #2
      id: 2,
      group: 'Tokens',
      menus: [
        {
          name: 'Tokens',
          linkTo: '/tokens',
          faIconName: 'fa-certificate'
        },
        {
          name: 'FAQ',
          linkTo: '/rules',
          faIconName: 'fa-info'
        },
        { 
          name: 'About',
          linkTo: '/about',
          faIconName: 'fa-cube'
        }
      ]
    },
    { // group menu #3
      id: 3,
      group: 'Admin',
      menus: [
        {
          name: 'Analysts',
          linkTo: '/admin/analysts',
          faIconName: 'fa-user-circle-o'
        },
        {
          name: 'Round Cycles',
          linkTo: '/admin/cycles',
          faIconName: 'fa-columns'
        }
      ]
    },
     // group menu #4
     /*
    {
      id: 4,
      group: 'Tests1',
      menus: [
        {
          name: 'General preview',
          linkTo: '/examples/general',
          faIconName: 'fa-eye'
        },
        {
          name:'Forms Test',
          linkTo:'/examples/form',
          faIconName: 'fa-eye'
        },
        {
          name: 'Upload briefs',
          linkTo: '/fileUpload',
          faIconName: 'fa-file'
        },
        {
          name: 'Dashboard Demo',
          linkTo: '/examples/home',
          faIconName: 'fa-eye'
        },
        {
          name: 'Basic Elements preview',
          linkTo: '/examples/basicElements',
          faIconName: 'fa-eye'
        },
        {
          name: 'Simple tables preview',
          linkTo: '/examples/simpleTables',
          faIconName: 'fa-eye'
        },
        {
          name: 'StatsCard',
          linkTo: '/examples/statsCard',
          faIconName: 'fa-check-square-o'
        },
        {
          name: 'EarningGraph',
          linkTo: '/examples/earningGraph',
          faIconName: 'fa-area-chart'
        },
        {
          name: 'Notifications',
          linkTo: '/examples/notifications',
          faIconName: 'fa-bell'
        },
        {
          name: 'Work progress',
          linkTo: '/examples/workProgress',
          faIconName: 'fa-briefcase'
        },
        {
          name: 'Twitter feed',
          linkTo: '/examples/twitterFeed',
          faIconName: 'fa-twitter'
        },
        {
          name: 'Team Mates',
          linkTo: '/examples/teamMates',
          faIconName: 'fa-user'
        },
        {
          name: 'Todo list',
          linkTo: '/Dashboard/todoList',
          faIconName: 'fa-check'
        }
      ]
    },
    // group menu #5
    {
      id: 5,
      group: 'Tests2',
      menus: [
         {
          name: 'Breadcrumb',
          linkTo: '/examples/breadcrumb',
          faIconName: 'fa-bars'
        },
        {
          name: 'Stat',
          linkTo: '/examples/stat',
          faIconName: 'fa-bar-chart'
        },
        {
          name: 'Basic progress bars',
          linkTo: '/examples/basicProgressBars',
          faIconName: 'fa-tasks'
        },
        {
          name: 'Tab panels',
          linkTo: '/examples/tabPanels',
          faIconName: 'fa-columns'
        },
        {
          name: 'Striped progress bar',
          linkTo: '/examples/stripedProgressBars',
          faIconName: 'fa-tasks'
        },
        {
          name: 'Alerts',
          linkTo: '/examples/alerts',
          faIconName: 'fa-exclamation-triangle'
        },
        {
          name: 'Pagination',
          linkTo: '/examples/pagination',
          faIconName: 'fa-sort'
        },
        {
          name: 'Default buttons',
          linkTo: '/examples/defaultButtons',
          faIconName: 'fa-hand-o-up'
        }
      ]
    },
        // group menu #6
    {
      id: 6,
      group: 'GridTests',
      menus: [
         {
          name: 'Simple',
          linkTo: '/examples/grid/simple',
          faIconName: 'fa-bars'
        },
        {
          name: 'CustomPager',
          linkTo: '/examples/grid/customPager',
          faIconName: 'fa-bar-chart'
        }
      ]
    }
    */
  ]
};
