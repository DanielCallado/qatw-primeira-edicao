import { test, expect } from '@playwright/test';

import { obterCodigo2FA } from '../support/db';

import { LoginPage } from '../pages/loginpage';
import { DashPage } from '../pages/DashPage';

import { cleanJobs, getJob } from '../support/reddis';

test('Não deve logar quando o código de autenticação é inválido', async ({ page }) => {
  const usuario = {
    cpf: '00000014141',
    senha: '147258'
  }

  await page.goto('http://paybank-mf-auth:3000/');

  await page.getByRole('textbox', { name: 'Digite seu CPF' }).fill(usuario.cpf);
  await page.getByRole('button', { name: 'Continuar' }).click();

  for (const digito of usuario.senha) {
    await page.getByRole('button', { name: digito }).click();
  }
  await page.getByRole('button', { name: 'Continuar' }).click();
  
  await page.getByRole('textbox', { name: '000000' }).fill('123123');
  await page.getByRole('button', { name: 'Verificar' }).click();

  await expect(page.locator('span')).toContainText('Código inválido. Por favor, tente novamente.');
});

test('Deve acessar a conta do usuário', async ({ page }) => {

  const loginPage = new LoginPage(page);
  const dashPage = new DashPage(page);

  const usuario = {
    cpf: '00000014141',
    senha: '147258'
  }

  await cleanJobs();

  await loginPage.acessaPagina();
  await loginPage.informaCPF(usuario.cpf);
  await loginPage.informaSenha(usuario.senha);

  await page.getByRole('heading', {name: 'Verificação em duas etapas'}).waitFor({timeout: 3000});

  const code = await getJob();

  // const code = await obterCodigo2FA(usuario.cpf);
  
  await loginPage.informaCodigo2FA(code);

  await expect(await dashPage.obterSaldo()).toHaveText('R$ 5.000,00');
});