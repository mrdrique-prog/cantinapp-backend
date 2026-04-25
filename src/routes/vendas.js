// src/pages/Contas.jsx
import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { TopBar, Avatar, avatarCor, formatMoeda, formatData, BtnPrimario, SectionTitle } from '../components/UI'
import { SenhaModal } from '../components/SenhaModal'
import { getConfig } from './Configuracoes'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api'
function getToken() { return localStorage.getItem('cantinapp_token') }

async function apiGet(path) {
  const res = await fetch(API + path, { headers: { 'Authorization': `Bearer ${getToken()}` } })
  return res.json()
}

async function apiPost(path, body) {
  const res = await fetch(API + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  })
  return res.json()
}

async function apiDelete(path) {
  const res = await fetch(API + path, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}

export function Contas() {
  const { ir } = useStore()
  const [devedores, setDevedores] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    apiGet('/relatorios/devedores')
      .then(data => { setDevedores(Array.isArray(data) ? data : []); setCarregando(false) })
      .catch(() => setCarregando(false))
  }, [])

  const filtrados = devedores.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))
  const total = filtrados.reduce((s, p) => s + p.saldo, 0)

  return (
    <>
      <TopBar titulo="Contas em Aberto" acoes={
        <span style={{ background: '#FFCDD2', color: '#D32F2F', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 700 }}>
          {formatMoeda(total)}
        </span>
      } />
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <span>🔍</span>
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar pessoa..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', fontFamily: 'inherit', background: 'transparent' }} />
        </div>
        {carregando && <div style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E' }}>Carregando...</div>}
        <SectionTitle>{filtrados.length} devedor{filtrados.length !== 1 ? 'es' : ''}</SectionTitle>
        {!carregando && filtrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9E9E9E' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>✅</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>Nenhum devedor!</div>
          </div>
        )}
        <div style={{ background: 'white', borderRadius: '12px', padding: '0 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {filtrados.map((p, idx) => (
            <div key={p.id}>
              <div onClick={() => ir('conta-detalhe', { pessoaId: p.id })} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', cursor: 'pointer' }}>
                <Avatar nome={p.nome} cor={avatarCor(p.id)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{p.nome}</div>
                  <div style={{ fontSize: '12px', color: '#9E9E9E', marginTop: '2px' }}>Toque para extrato completo</div>
                </div>
                <span style={{ background: '#FFEBEE', color: '#D32F2F', borderRadius: '20px', padding: '4px 10px', fontSize: '13px', fontWeight: 600 }}>{formatMoeda(p.saldo)}</span>
              </div>
              {idx < filtrados.length - 1 && <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export function ContaDetalhe() {
  const { params, ir, mostrarToast } = useStore()
  const { pessoaId } = params
  const [pessoa, setPessoa] = useState(null)
  const [extrato, setExtrato] = useState([])
  const [saldo, setSaldo] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [itemParaApagar, setItemParaApagar] = useState(null)

  const carregar = async () => {
    setCarregando(true)
    try {
      const [p, ext] = await Promise.all([
        apiGet(`/pessoas/${pessoaId}`),
        apiGet(`/pessoas/${pessoaId}/extrato`)
      ])
      setPessoa(p)
      setSaldo(p.saldo || 0)
      setExtrato(Array.isArray(ext) ? ext : [])
    } catch (e) {
      console.error('Erro ao carregar:', e)
      mostrarToast('Erro ao carregar extrato', 'erro')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [pessoaId])

  const handleApagarVenda = async () => {
    try {
      await apiDelete(`/vendas/${itemParaApagar.vendaId}`)
      mostrarToast('Venda removida!')
      setItemParaApagar(null)
      setCarregando(true)
      await carregar()
    } catch (e) {
      mostrarToast('Erro ao apagar venda', 'erro')
      setItemParaApagar(null)
    }
  }

  return (
    <>
      {itemParaApagar && (
        <SenhaModal
          titulo="Confirmar exclusao"
          descricao={`Apagar venda de ${itemParaApagar.desc} (${formatData(itemParaApagar.data)})?`}
          onConfirmar={handleApagarVenda}
          onCancelar={() => setItemParaApagar(null)}
        />
      )}
      <TopBar titulo={pessoa?.nome || 'Carregando...'} />
      <div style={{ padding: '16px', paddingBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <Avatar nome={pessoa?.nome || ''} cor={avatarCor(pessoaId)} size={52} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>{pessoa?.nome}</div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>{pessoa?.telefone}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#9E9E9E' }}>Saldo</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: saldo > 0 ? '#D32F2F' : '#2E7D32' }}>{formatMoeda(saldo)}</div>
          </div>
        </div>
        {saldo > 0 && (
          <BtnPrimario onClick={() => ir('pagamento', { pessoaId, saldo })} style={{ marginBottom: '16px' }}>
            Registrar Pagamento
          </BtnPrimario>
        )}
        <SectionTitle>Extrato ({extrato.length} lancamentos)</SectionTitle>
        {carregando && <div style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E' }}>Carregando...</div>}
        <div style={{ background: 'white', borderRadius: '12px', padding: '0 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {extrato.length === 0 && !carregando && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#9E9E9E', fontSize: '14px' }}>Nenhum lancamento</div>
          )}
          {extrato.map((item, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 0' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: item.tipo === 'compra' ? '#D32F2F' : '#2E7D32', marginTop: '5px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#1A1A1A' }}>{item.desc}</div>
                  <div style={{ fontSize: '11px', color: '#9E9E9E', marginTop: '2px' }}>{formatData(item.data)}{item.domingoDesc ? ` - ${item.domingoDesc}` : ''}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: item.valor < 0 ? '#D32F2F' : '#2E7D32' }}>
                    {item.valor < 0 ? '-' : '+'}{formatMoeda(Math.abs(item.valor))}
                  </div>
                  {item.tipo === 'compra' && item.vendaId && (
                    <button onClick={() => setItemParaApagar(item)} style={{
                      background: '#FFEBEE', color: '#D32F2F', border: 'none',
                      borderRadius: '6px', padding: '4px 8px', fontSize: '11px',
                      cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600
                    }}>
                      Apagar
                    </button>
                  )}
                </div>
              </div>
              {idx < extrato.length - 1 && <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export function Pagamento() {
  const { params, mostrarToast, ir } = useStore()
  const { pessoaId, saldo: saldoParam } = params
  const [pessoa, setPessoa] = useState(null)
  const [saldo, setSaldo] = useState(saldoParam || 0)
  const [valor, setValor] = useState(saldoParam > 0 ? saldoParam.toFixed(2) : '')
  const [forma, setForma] = useState('PIX')
  const [recebidoPor, setRecebidoPor] = useState('')
  const [obs, setObs] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const config = getConfig()
  const adms = config.adms || []

  useEffect(() => {
    apiGet(`/pessoas/${pessoaId}`).then(p => {
      setPessoa(p); setSaldo(p.saldo || 0)
      if (!valor) setValor((p.saldo || 0).toFixed(2))
    })
  }, [pessoaId])

  const atalhos = [saldo, 50, 30, 20, 10].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
  const formas = ['PIX', 'Dinheiro', 'Cartao', 'Transferencia']

  const handleSalvar = () => {
    const v = parseFloat(valor)
    if (!v || v <= 0) { mostrarToast('Informe um valor valido!', 'erro'); return }
    if (!recebidoPor) { mostrarToast('Selecione quem recebeu!', 'erro'); return }
    setMostrarSenha(true)
  }

  const confirmarPagamento = async () => {
    setMostrarSenha(false)
    setSalvando(true)
    const v = parseFloat(valor)
    const observacaoFinal = `Recebido por: ${recebidoPor}${obs ? ' | ' + obs : ''}`
    await apiPost('/pagamentos', { pessoaId, valor: v, forma, observacao: observacaoFinal })
    mostrarToast(`Pagamento de ${formatMoeda(v)} registrado!`)
    ir('contas')
    setSalvando(false)
  }

  return (
    <>
      {mostrarSenha && (
        <SenhaModal
          titulo="Confirmar pagamento"
          descricao={`Registrar ${formatMoeda(parseFloat(valor))} para ${pessoa?.nome}`}
          onConfirmar={confirmarPagamento}
          onCancelar={() => setMostrarSenha(false)}
        />
      )}
      <TopBar titulo="Receber Pagamento" />
      <div style={{ padding: '16px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <Avatar nome={pessoa?.nome || ''} cor={avatarCor(pessoaId)} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{pessoa?.nome}</div>
            <div style={{ fontSize: '13px', color: saldo > 0 ? '#D32F2F' : '#2E7D32', fontWeight: 500 }}>
              {saldo > 0 ? `Deve ${formatMoeda(saldo)}` : 'Sem saldo devedor'}
            </div>
          </div>
        </div>
        <SectionTitle>Valor recebido</SectionTitle>
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9E9E9E', fontSize: '16px' }}>R$</span>
          <input type="number" value={valor} onChange={e => setValor(e.target.value)}
            placeholder="0,00" style={{ width: '100%', padding: '14px 14px 14px 40px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '22px', fontWeight: 700, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#2E7D32' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {atalhos.map(v => (
            <button key={v} onClick={() => setValor(v.toFixed(2))} style={{
              background: parseFloat(valor) === v ? '#2E7D32' : '#E8F5E9',
              color: parseFloat(valor) === v ? 'white' : '#2E7D32',
              border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}>{formatMoeda(v)}</button>
          ))}
        </div>
        <SectionTitle>Forma de pagamento</SectionTitle>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {formas.map(f => (
            <button key={f} onClick={() => setForma(f)} style={{
              background: forma === f ? '#2E7D32' : '#E8F5E9',
              color: forma === f ? 'white' : '#2E7D32',
              border: 'none', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}>{f}</button>
          ))}
        </div>
        <SectionTitle>Recebido por</SectionTitle>
        {adms.length === 0 ? (
          <div style={{ background: '#FFF8E1', border: '1px solid #FBC02D', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#F57F17', marginBottom: '16px' }}>
            Nenhum ADM cadastrado. Va em Configuracoes &gt; ADM para cadastrar.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {adms.map(adm => (
              <button key={adm} onClick={() => setRecebidoPor(adm)} style={{
                background: recebidoPor === adm ? '#2E7D32' : '#E8F5E9',
                color: recebidoPor === adm ? 'white' : '#2E7D32',
                border: 'none', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>{adm}</button>
            ))}
          </div>
        )}
        <textarea value={obs} onChange={e => setObs(e.target.value)}
          placeholder="Observacao (opcional)" rows={2}
          style={{ width: '100%', padding: '12px 14px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'none', marginBottom: '16px' }} />
        <BtnPrimario onClick={handleSalvar} disabled={salvando || !valor || !recebidoPor}>
          {salvando ? 'Registrando...' : 'Confirmar Pagamento'}
        </BtnPrimario>
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#9E9E9E', marginTop: '8px' }}>
          Requer confirmacao de senha
        </div>
      </div>
    </>
  )
}
