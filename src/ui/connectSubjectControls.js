export function connectSubjectControls(subjects, onChange) {
  const type = document.querySelector('#subject-type'), pose = document.querySelector('#subject-pose'), region = document.querySelector('#subject-region');
  const height = document.querySelector('#subject-height'), x = document.querySelector('#subject-x'), z = document.querySelector('#subject-z'), yaw = document.querySelector('#subject-yaw');
  const rotation = document.querySelector('#subject-rotation');
  rotation.addEventListener('input', () => { yaw.value = rotation.value; yaw.dispatchEvent(new Event('input')); });
  yaw.addEventListener('input', () => { if (yaw.checkValidity()) rotation.value = yaw.value; });
  const status = document.querySelector('#subject-status'), fileInput = document.querySelector('#subject-file');
  function sync() {
    document.querySelector('#human-options').hidden = type.value !== 'human';
    height.value = subjects.height().toFixed(3); x.value = z.value = yaw.value = rotation.value = 0;
    subjects.setRegion(type.value === 'human' ? region.value : 'full'); onChange();
  }
  function select() { subjects.select(type.value, pose.value); sync(); }
  type.addEventListener('change', select); pose.addEventListener('change', select);
  region.addEventListener('change', () => { subjects.setRegion(region.value); onChange(); });
  for (const input of [height, x, z, yaw]) input.addEventListener('input', () => {
    if (![height, x, z, yaw].every(field => field.value !== '' && field.checkValidity() && Number.isFinite(Number(field.value)))) { status.textContent = 'Enter values within the displayed limits.'; return; }
    subjects.place(Number(height.value), Number(x.value), Number(z.value), Number(yaw.value)); onChange({ placement: true });
    status.textContent = 'Subject updated. Use Frame and focus subject when you want to recompose.';
  });
  document.querySelector('#fit-subject').addEventListener('click', onChange);
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0]; if (!file) return;
    fileInput.disabled = type.disabled = pose.disabled = true; status.textContent = 'Loading model…';
    try {
      const sourceHeight = await subjects.importFile(file);
      document.querySelector('#import-option').disabled = false;
      document.querySelector('#import-option').textContent = "Imported GLB: " + file.name; type.value = 'import';
      // GLB units are metres. Very large/small assets get a usable starting height.
      if (sourceHeight < .05 || sourceHeight > 3) subjects.place(1, 0, 0, 0);
      sync(); status.textContent = `${file.name} loaded. Check its height below. Static pose only; reload clears the import.`;
    } catch (error) { status.textContent = `Could not import: ${error.message}`; }
    finally { fileInput.disabled = type.disabled = pose.disabled = false; fileInput.value = ''; }
  });
}



