// Composables
import { createRouter, createWebHistory, RouteLocationNormalized } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: [
      {
        path: '',
        redirect: 'search',
      },
      {
        path: 'search',
        name: 'Search',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "search" */ '@/views/Search.vue'),
        // this code returns a warning, but only for route.params[x]??
        props: (route: RouteLocationNormalized) => ({
          q: route.query.q || '',
          el: route.query.el,
          tag: route.query.tag,
          bid: route.query.bid,
          page: route.query.page,
          perPage: route.query.perPage,
        }),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
