const { response } = require("express");
const express = require("express");

const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const customers = [];

//Middlewares

function verifyIfExistsAccountCPF(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) return res.status(400).json({ error: "Customer not found" });

  req.customer = customer;

  return next();
}

function getBalance(statement) {
  return statement.reduce(
    (acc, operation) =>
      acc + (operation.type === "credit")
        ? operation.amount
        : -1 * operation.amount,
    0
  );
}

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );
  if (customerAlreadyExists)
    return res.status(400).json({ error: "Customer already exists" });

  customers.push({ cpf, name, id: uuidv4(), statement: [] });

  return res.status(201).json({ customers });
});

app.get("/statements", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  return res.json(customer.statement);
});

app.get("/statementsdate/:cpf", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;
  console.log(date);

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return res.json(statement);
});

app.put("/deposit/:cpf/", verifyIfExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  };

  customer.statement.push(statementOperation);

  return res.status(200).json(customer.statement);
});
app.put("/withdraw/:cpf/", verifyIfExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;
  const balance = getBalance(customer.statement);

  if (balance < amount)
    return res.status(400).json({ error: "Insufficient funds" });

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
  };

  customer.statement.push(statementOperation);

  return res.status(200).json(customer.statement);
});

app.listen(5000, () => {
  console.log(customers, "Running on port 5000");
});
