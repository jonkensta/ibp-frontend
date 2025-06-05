import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import InmatesSearchView from '../views/InmatesSearchView.vue'
import InmateDetailView from '../views/InmateDetailView.vue'
import UnitsListView from '../views/UnitsListView.vue'
import UnitDetailView from '../views/UnitDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/inmates',
      name: 'inmates-search',
      component: InmatesSearchView,
    },
    {
      path: '/inmates/:jurisdiction/:id',
      name: 'inmate-detail',
      component: InmateDetailView,
      props: true, // Pass route params as props
    },
    {
      path: '/units',
      name: 'units-list',
      component: UnitsListView,
    },
    {
      path: '/units/:jurisdiction/:name',
      name: 'unit-detail',
      component: UnitDetailView,
      props: true, // Pass route params as props
    },
  ],
})

export default router
