/** @jsxImportSource @emotion/react */
import { createFileRoute } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { css } from '@emotion/react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/task/$taskId')({
  component: TaskComponent,
})

function TaskComponent() {
  const navigate = useNavigate()
  const { taskId } = Route.useParams()
  const mission = useSelector(state => state.missions.list.find(m => m.id === taskId))

  if (!mission) {
    return (
      <main className="app-main" >
        <Header />
        <div className="app-body" css={notFoundStyle}>
          <p>Tarefa não encontrada</p>
          <button className="button secondary" onClick={() => navigate({ to: '/' })}>
            Voltar
          </button>
        </div>
        <Footer active="home" />
      </main>
    )
  }

  const { name, description, location, value, tags, status, risk, createdDate, expiresDate } = mission

  return (
    <main className="app-main">
      <Header />
      <div className="app-body" css={detailBody}>
        <h1>{name}</h1>
        <p>{description}</p>
        <img src="https://placehold.co/600x400" alt="" />
        <ul>
          <li><strong>Status:</strong> {status}</li>
          <li><strong>Risco:</strong> {risk}</li>
          <li><strong>Localização:</strong> {location}</li>
          <li><strong>Valor:</strong> ${value}</li>
          <li><strong>Tags:</strong> {tags.join(', ')}</li>
          <li><strong>Criada em:</strong> {new Date(createdDate).toLocaleDateString()}</li>
          <li><strong>Expira em:</strong> {new Date(expiresDate).toLocaleDateString()}</li>
        </ul>
        <button className="button primary" onClick={() => navigate({ to: '/' })}>Voltar</button>
      </div>
      <Footer active="home" />
    </main>
  )
}

const detailBody = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;

  h1 {
    font-size: 20px;
    margin-bottom: 8px;
  }

  ul {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;

    li {
      margin-bottom: 8px;

      strong {
        margin-right: 4px;
      }
    }
  }
`

const notFoundStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  font-size: 18px;

  p {
    margin-bottom: 16px;
  }
`