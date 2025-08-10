import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import ansis from 'ansis';
import type { SupportedLang } from '../../constants';
import { I18N } from '../../constants';

const execAsync = promisify(exec);

export async function isCcrInstalled(): Promise<boolean> {
  try {
    // Try to run ccr version to check if it's installed
    await execAsync('ccr version');
    return true;
  } catch {
    // If ccr command not found, try which command
    try {
      await execAsync('which ccr');
      return true;
    } catch {
      return false;
    }
  }
}

export async function getCcrVersion(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('ccr version');
    // Extract version from output
    const match = stdout.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function installCcr(scriptLang: SupportedLang): Promise<void> {
  const i18n = I18N[scriptLang];
  
  // First check if already installed
  const installed = await isCcrInstalled();
  if (installed) {
    console.log(ansis.green(`✔ ${i18n.ccrAlreadyInstalled}`));
    return;
  }
  
  console.log(ansis.cyan(`📦 ${i18n.installingCcr}`));
  
  try {
    await execAsync('npm install -g claude-code-router --force');
    
    console.log(ansis.green(`✔ ${i18n.ccrInstallSuccess}`));
  } catch (error: any) {
    // Check if it's an EEXIST error
    if (error.message?.includes('EEXIST')) {
      console.log(ansis.yellow(`⚠ ${i18n.ccrAlreadyInstalled}`));
      return;
    }
    console.error(ansis.red(`✖ ${i18n.ccrInstallFailed}`));
    throw error;
  }
}

export async function startCcrService(scriptLang?: SupportedLang): Promise<void> {
  const lang = scriptLang || 'zh-CN';
  const i18n = I18N[lang];
  
  try {
    // Start CCR service in background
    exec('ccr', (error) => {
      if (error) {
        console.error(ansis.red(`${i18n.failedToStartCcrService}:`), error);
      }
    });
    
    // Give it a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.error(ansis.red(`${i18n.errorStartingCcrService}:`), error);
  }
}