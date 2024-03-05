import { Repositories } from '@/apis/repositoryFactory'

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $repository: Repositories
  }
}
