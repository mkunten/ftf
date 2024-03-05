import TextRepository from '@/apis/textRepository'

export interface Repositories {
  texts: TextRepository
}

function getRepositories(): Repositories {
  const texts = new TextRepository()
  const repositories: Repositories = {
    texts,
  }
  return repositories
}

export default getRepositories()
