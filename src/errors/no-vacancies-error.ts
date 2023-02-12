import { ApplicationError } from '../protocols';

export function noVacanciesAvailableError(): ApplicationError {
  return {
    name: 'NoVacanciesAvailableError',
    message: 'Desculpe, não há vagas no momento!!',
  };
}
