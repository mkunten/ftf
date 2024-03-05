import { AxiosPromise } from 'axios'
import repository from '@/apis/repository'

const resource = ''

export interface TextSearchQueryString {
  q: string
  el?: string
  tag?: string
  bid?: string
}

export default class TextRepository {
  public getNgramSearch(params: TextSearchQueryString): AxiosPromise<any> {
    return repository.get<any>(`${resource}/search`, {
      params,
    })
  }

  public getCount(): AxiosPromise<any> {
    return repository.get<any>(`${resource}/countRecord`)
  }
}
