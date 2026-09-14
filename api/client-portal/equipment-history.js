import { Pool } from 'pg';
import { getAuthUser } from '../_utils/auth.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let user;
  try {
    user = getAuthUser(req);
    if (!user || !user.clientId) {
      return res.status(401).json({ error: 'Acesso não autorizado.' });
    }
  } catch (authErr) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }

  const clientId = Number(user.clientId);
  const equipmentId = Number(req.query.equipment_id || req.query.id);

  if (!equipmentId) {
    return res.status(400).json({ error: 'ID do equipamento é obrigatório.' });
  }

  const dbClient = await pool.connect();
  try {
    // 1. Verify equipment belongs to this client
    const eqRes = await dbClient.query(`
      SELECT * FROM equipments 
      WHERE id = $1 AND client_id = $2
      LIMIT 1
    `, [equipmentId, clientId]);

    if (eqRes.rows.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado ou não pertence ao seu cadastro.' });
    }

    const equipment = eqRes.rows[0];

    // 2. Fetch all tickets and linked budgets for this equipment
    const historyRes = await dbClient.query(`
      SELECT 
        st.id,
        st.ticket_type,
        st.status,
        st.priority,
        st.description,
        st.scheduled_date,
        st.closed_at,
        st.created_at,
        st.resolution_notes,
        st.evidence_photos,
        st.hour_meter,
        st.technician_name,
        COALESCE(t.name, st.technician_name) as assigned_technician,
        b.id as budget_id,
        b.grand_total as budget_grand_total,
        b.total_parts as budget_total_parts,
        b.total_labor as budget_total_labor,
        b.status as budget_status
      FROM service_tickets st
      LEFT JOIN LATERAL (
        SELECT id, grand_total, total_parts, total_labor, status
        FROM budgets 
        WHERE id = st.budget_id OR ticket_id = st.id
        ORDER BY id DESC
        LIMIT 1
      ) b ON true
      WHERE st.equipment_id = $1 AND st.client_id = $2
      ORDER BY st.created_at DESC
    `, [equipmentId, clientId]);

    const tickets = historyRes.rows;

    // Calculate total maintenance spend
    const seenBudgetIds = new Set();
    let totalCost = 0;
    let totalTickets = tickets.length;
    let completedTickets = 0;

    tickets.forEach(t => {
      const s = (t.status || '').toLowerCase();
      if (s.includes('conclu') || s.includes('finaliz')) completedTickets++;

      if (t.budget_id && !seenBudgetIds.has(t.budget_id) && t.budget_grand_total) {
        seenBudgetIds.add(t.budget_id);
        totalCost += parseFloat(t.budget_grand_total) || 0;
      }
    });

    // Benchmark comparison: Reference new machine cost (e.g. R$ 25.000 for standard industrial walk-behind scrubber)
    const benchmarkReferenceValue = 26000;
    const maintenanceRatio = Math.min(100, Math.round((totalCost / benchmarkReferenceValue) * 100));

    let replacementRecommendation = {
      level: 'good', // 'good' | 'warning' | 'replace'
      badge: 'Excelente Estado',
      color: 'emerald',
      title: 'Equipamento em Faixa Econômica Saudável',
      description: 'O custo acumulado de manutenções está baixo em relação ao valor do ativo. Continue mantendo as revisões preventivas em dia.',
      actionCta: 'Agendar Manutenção Preventiva'
    };

    if (maintenanceRatio >= 45 && maintenanceRatio < 65) {
      replacementRecommendation = {
        level: 'warning',
        badge: 'Atenção aos Custos Acumulados',
        color: 'amber',
        title: 'Custo de Manutenção em Ascensão',
        description: 'Os gastos acumulados com peças e reparos estão se aproximando da metade do valor de um equipamento novo. Avalie um diagnóstico geral completo.',
        actionCta: 'Solicitar Revisão Geral'
      };
    } else if (maintenanceRatio >= 65 || (totalCost > 15000)) {
      replacementRecommendation = {
        level: 'replace',
        badge: 'Hora Recomendada de Trocar o Equipamento',
        color: 'rose',
        title: 'Substituição Altamente Recomendada',
        description: 'O custo histórico de manutenção desta máquina já superou o limite de viabilidade econômica. Renovar por uma máquina nova Tennant ou locação Clean Tech Pro reduz custos e elimina paradas na operação.',
        actionCta: 'Simular Troca / Locação Nova'
      };
    }

    return res.status(200).json({
      success: true,
      equipment,
      metrics: {
        total_tickets: totalTickets,
        completed_tickets: completedTickets,
        total_cost: totalCost,
        benchmark_value: benchmarkReferenceValue,
        maintenance_ratio: maintenanceRatio,
        recommendation: replacementRecommendation
      },
      history: tickets
    });

  } catch (error) {
    console.error('Erro ao buscar histórico do equipamento:', error);
    return res.status(500).json({ error: 'Erro interno ao consultar histórico.' });
  } finally {
    dbClient.release();
  }
}
