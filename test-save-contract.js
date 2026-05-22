import handler from './api/save-contract.js';

async function test() {
  const req = {
    method: 'POST',
    body: {
      client_id: 1,
      start_date: '2026-05-22',
      status: 'Reserva',
      equipments: [],
      services: [],
      observations: '',
      total_rental_value: 0,
      total_services_value: 0,
      total_venal_value: 0
    }
  };

  const res = {
    status: function(code) {
      console.log('Status:', code);
      return this;
    },
    json: function(data) {
      console.log('JSON:', data);
    }
  };

  await handler(req, res);
}

test();
